import uuid
import re
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from src.domain.models.course import Course
from src.domain.models.course.course_type import CourseType
from src.domain.models.course.course_category import CourseCategory
from src.domain.models.course.course_dependency import CourseDependency
from src.domain.models.major.major_requirement import MajorRequirement
from src.domain.models.student.student_passed_courses import student_passed_courses
from src.domain.models.dependency_type import DependencyType
from src.services.sync.google_sheets import GoogleSheetsService

class CourseSyncService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.sheets_service = GoogleSheetsService()
        self.category_map = {
            "Бизнес и аналитика": CourseCategory.business,
            "Искусственный интеллект": CourseCategory.tech, # or stem
            "Разработка": CourseCategory.tech
        }

    async def sync_all(self):
        """Synchronizes all courses from Google Sheets to the database."""
        all_sheets_data = self.sheets_service.get_all_relevant_sheets()
        
        # 1. Clear existing data (to avoid FK issues during rebuild)
        await self.session.execute(delete(student_passed_courses))
        await self.session.execute(delete(MajorRequirement))
        await self.session.execute(delete(CourseDependency))
        await self.session.execute(delete(Course))
        
        course_map = {} # title -> Course object
        all_rows = []

        # 2. First pass: Create all Course objects
        for sheet_name, rows in all_sheets_data.items():
            category = self.category_map.get(sheet_name, CourseCategory.tech)
            for row in rows:
                raw_title = row.get("Название курса", "").strip()
                if not raw_title or raw_title in course_map:
                    continue
                
                course = self._map_row_to_course(row, category)
                self.session.add(course)
                course_map[raw_title] = course
                all_rows.append((row, course))

        await self.session.flush() # Ensure courses have IDs

        # 3. Second pass: Create dependencies
        for row, course in all_rows:
            await self._sync_dependencies(row, course, course_map)

        await self.session.commit()
        return len(course_map)

    def _normalize_title(self, raw_title: str) -> str:
        """Removes leading circles/emojis and extra whitespace for deduplication."""
        return re.sub(r'^[\u2600-\u27BF\U0001f300-\U0001f64f\U0001f680-\U0001f6ff\U0001f534\U0001f535\u26ab]\s*', '', raw_title).strip()

    def _map_row_to_course(self, row: Dict[str, Any], category: CourseCategory) -> Course:
        raw_title = row.get("Название курса", "").strip()
        title = self._normalize_title(raw_title)
        
        # Map Course Type
        raw_type = row.get("Тип курса", "").lower()
        if "core" in raw_type or "mandatory" in raw_type:
            c_type = CourseType.mandatory
        elif "choice" in raw_type or "elective" in raw_type or "факультатив" in raw_type:
            c_type = CourseType.elective
        else:
            c_type = CourseType.other

        # Map Semesters
        raw_sem = row.get("Осень / весна", "").lower()
        if "осень" in raw_sem:
            semesters = [1, 3, 5, 7]
        elif "весна" in raw_sem:
            semesters = [2, 4, 6, 8]
        else: # сквозной or other
            semesters = [1, 2, 3, 4, 5, 6, 7, 8]

        # Map Recommended Semester
        raw_rec_sem = str(row.get("Рекомендованный к прохождению семестр", ""))
        rec_sem_match = re.search(r'(\d+)', raw_rec_sem)
        recommended_semester = int(rec_sem_match.group(1)) if rec_sem_match else None

        return Course(
            id=uuid.uuid4(),
            title=raw_title,
            description=row.get("Контекст", ""),
            handbook_link=row.get("Силлабус если есть", ""),
            course_type=c_type,
            category=category,
            available_semesters=semesters,
            recommended_semester=recommended_semester,
            workload=5.0, # Default workload if not in sheet
            allowed_cohorts=[2024, 2025, 2026] # Default
        )

    async def _sync_dependencies(self, row: Dict[str, Any], course: Course, course_map: Dict[str, Course]):
        # Prerequisites
        raw_prereqs = row.get("Пререквизиты", "")
        if raw_prereqs and isinstance(raw_prereqs, str):
            titles = [t.strip() for t in raw_prereqs.split(",") if t.strip()]
            for p_title in titles:
                if p_title in course_map:
                    dep = CourseDependency(
                        course_id=course.id,
                        required_course_id=course_map[p_title].id,
                        dependency_type=DependencyType.prerequisite
                    )
                    self.session.add(dep)

        # Corequisites
        raw_coreqs = row.get("Кореквизиты", "")
        if raw_coreqs and isinstance(raw_coreqs, str):
            titles = [t.strip() for t in raw_coreqs.split(",") if t.strip()]
            for c_title in titles:
                if c_title in course_map:
                    dep = CourseDependency(
                        course_id=course.id,
                        required_course_id=course_map[c_title].id,
                        dependency_type=DependencyType.corequisite_type1 # Default to type1
                    )
                    self.session.add(dep)
