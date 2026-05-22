import uuid
import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from src.domain.models.course import Course
from src.domain.models.course.course_type import CourseType
from src.domain.models.course.course_category import CourseCategory
from src.domain.models.course.course_dependency import CourseDependency
from src.domain.models.major import Major
from src.domain.models.major.major_requirement import MajorRequirement
from src.domain.models.requirement_type import RequirementType
from src.domain.models.student.student_passed_courses import student_passed_courses
from src.domain.models.dependency_type import DependencyType
from src.services.sync.google_sheets import GoogleSheetsService


# Mapping: Google Sheet name → (Major title, Major school, CourseCategory)
SHEET_TO_MAJOR: Dict[str, Tuple[str, str, CourseCategory]] = {
    "Бизнес и аналитика": ("Business", "Business", CourseCategory.business),
    "Искусственный интеллект": ("AI", "Tech", CourseCategory.ai),
    "Разработка": ("Software Engineering", "Tech", CourseCategory.tech),
}

# Courses that appear in multiple majors / shared across all
COMMON_MAJOR_TITLE = "Common (All Majors)"
COMMON_MAJOR_SCHOOL = "Business"


class CourseSyncService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.sheets_service = GoogleSheetsService()

    async def sync_all(self) -> Dict[str, int]:
        """
        Full sync from Google Sheets:
        1. Clears old data (courses, deps, major reqs — but NOT majors themselves).
        2. Upserts majors from SHEET_TO_MAJOR + Common.
        3. Creates courses per sheet.
        4. Creates course dependencies.
        5. Creates major_requirements linking each course to its sheet's major.
        Returns stats dict.
        """
        all_sheets_data = self.sheets_service.get_all_relevant_sheets()

        # 1. Clear volatile data (preserve majors table — we upsert below)
        await self.session.execute(delete(student_passed_courses))
        await self.session.execute(delete(MajorRequirement))
        await self.session.execute(delete(CourseDependency))
        await self.session.execute(delete(Course))
        await self.session.flush()

        # 2. Upsert majors
        major_map: Dict[str, Major] = {}
        all_major_titles = [
            (title, school) for _, (title, school, _) in SHEET_TO_MAJOR.items()
        ]
        all_major_titles.append((COMMON_MAJOR_TITLE, COMMON_MAJOR_SCHOOL))

        for title, school in all_major_titles:
            result = await self.session.execute(
                select(Major).where(Major.title == title)
            )
            existing = result.scalar_one_or_none()
            if existing:
                major_map[title] = existing
            else:
                new_major = Major(id=uuid.uuid4(), title=title, school=school)
                self.session.add(new_major)
                major_map[title] = new_major

        await self.session.flush()

        # 3. First pass: create Course objects, track sheet membership
        course_map: Dict[str, Course] = {}  # normalized title → Course
        # course_title → list of major titles it belongs to
        course_to_majors: Dict[str, List[str]] = {}
        all_rows: List[Tuple[Dict[str, Any], Course]] = []

        for sheet_name, rows in all_sheets_data.items():
            _, _, category = SHEET_TO_MAJOR.get(
                sheet_name, ("Unknown", "Tech", CourseCategory.tech)
            )
            major_title = SHEET_TO_MAJOR.get(sheet_name, (None,))[0]

            for row in rows:
                raw_title = row.get("Название курса", "").strip()
                if not raw_title:
                    continue

                norm_title = self._normalize_title(raw_title)

                if norm_title not in course_map:
                    course = self._map_row_to_course(row, category)
                    self.session.add(course)
                    course_map[norm_title] = course
                    all_rows.append((row, course))
                    course_to_majors[norm_title] = []

                if major_title:
                    if major_title not in course_to_majors[norm_title]:
                        course_to_majors[norm_title].append(major_title)

        await self.session.flush()

        # 4. Second pass: create dependencies
        for row, course in all_rows:
            await self._sync_dependencies(row, course, course_map)

        # 5. Third pass: create major_requirements
        req_count = 0
        for norm_title, majors_for_course in course_to_majors.items():
            course = course_map[norm_title]
            for m_title in majors_for_course:
                if m_title in major_map:
                    req = MajorRequirement(
                        id=uuid.uuid4(),
                        major_id=major_map[m_title].id,
                        course_id=course.id,
                        requirement_type=RequirementType.core,
                    )
                    self.session.add(req)
                    req_count += 1

        await self.session.commit()

        return {
            "courses": len(course_map),
            "majors": len(major_map),
            "major_requirements": req_count,
        }

    def _normalize_title(self, raw_title: str) -> str:
        """Removes leading emoji/circles for deduplication key."""
        return re.sub(
            r"^[\u2600-\u27BF\U0001f300-\U0001f64f\U0001f680-\U0001f6ff"
            r"\U0001f534\U0001f535\u26ab]\s*",
            "",
            raw_title,
        ).strip()

    def _map_row_to_course(
        self, row: Dict[str, Any], category: CourseCategory
    ) -> Course:
        raw_title = row.get("Название курса", "").strip()

        # Course type
        raw_type = row.get("Тип курса", "").lower()
        if "core" in raw_type or "mandatory" in raw_type:
            c_type = CourseType.mandatory
        elif (
            "choice" in raw_type or "elective" in raw_type or "факультатив" in raw_type
        ):
            c_type = CourseType.elective
        else:
            c_type = CourseType.other

        # Semester availability
        raw_sem = row.get("Осень / весна", "").lower()
        if "осень" in raw_sem:
            semesters = [1, 3, 5, 7]
        elif "весна" in raw_sem:
            semesters = [2, 4, 6, 8]
        else:
            semesters = [1, 2, 3, 4, 5, 6, 7, 8]

        # Recommended semester
        raw_rec = str(row.get("Рекомендованный к прохождению семестр", ""))
        rec_match = re.search(r"(\d+)", raw_rec)
        recommended_semester = int(rec_match.group(1)) if rec_match else None

        # Workload — try to read from sheet, default 5
        raw_workload = str(row.get("Нагрузка", row.get("workload", "5")))
        workload_match = re.search(r"(\d+(?:\.\d+)?)", raw_workload)
        workload = float(workload_match.group(1)) if workload_match else 5.0

        return Course(
            id=uuid.uuid4(),
            title=raw_title,
            description=row.get("Контекст", ""),
            handbook_link=row.get("Силлабус если есть", ""),
            course_type=c_type,
            category=category,
            available_semesters=semesters,
            recommended_semester=recommended_semester,
            workload=workload,
            allowed_cohorts=[2024, 2025, 2026],
        )

    async def _sync_dependencies(
        self,
        row: Dict[str, Any],
        course: Course,
        course_map: Dict[str, Course],
    ) -> None:
        # Prerequisites
        raw_prereqs = row.get("Пререквизиты", "")
        if raw_prereqs and isinstance(raw_prereqs, str):
            for p_title in [t.strip() for t in raw_prereqs.split(",") if t.strip()]:
                norm = self._normalize_title(p_title)
                target = course_map.get(norm) or course_map.get(p_title)
                if target:
                    self.session.add(
                        CourseDependency(
                            course_id=course.id,
                            required_course_id=target.id,
                            dependency_type=DependencyType.prerequisite,
                        )
                    )

        # Corequisites
        raw_coreqs = row.get("Кореквизиты", "")
        if raw_coreqs and isinstance(raw_coreqs, str):
            for c_title in [t.strip() for t in raw_coreqs.split(",") if t.strip()]:
                norm = self._normalize_title(c_title)
                target = course_map.get(norm) or course_map.get(c_title)
                if target:
                    self.session.add(
                        CourseDependency(
                            course_id=course.id,
                            required_course_id=target.id,
                            dependency_type=DependencyType.corequisite_type1,
                        )
                    )
