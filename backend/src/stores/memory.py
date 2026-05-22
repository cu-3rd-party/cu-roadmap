import os
import csv
import uuid
from uuid import UUID
from typing import Dict, List, Optional, Set
from collections import defaultdict

from .base import (
    StoreBase,
    CourseData,
    CourseDependencyData,
    MajorData,
    MajorRequirementData,
    StudentData,
    DependencyTypeEnum,
    RequirementTypeEnum,
    CourseTypeEnum,
    CourseCategoryEnum,
)


class MemoryStore(StoreBase):
    def __init__(self):
        self._courses: Dict[UUID, CourseData] = {}
        self._majors: Dict[UUID, MajorData] = {}
        self._major_requirements: List[MajorRequirementData] = []
        self._course_dependencies: List[CourseDependencyData] = []
        self._students: Dict[UUID, StudentData] = {}

        self._courses_by_title: Dict[str, UUID] = {}
        self._majors_by_title: Dict[str, UUID] = {}
        self._course_deps_by_course: Dict[UUID, List[CourseDependencyData]] = (
            defaultdict(list)
        )

    async def init(self) -> None:
        pass

    async def close(self) -> None:
        pass

    async def clear_all(self) -> None:
        self._courses.clear()
        self._majors.clear()
        self._major_requirements.clear()
        self._course_dependencies.clear()
        self._students.clear()
        self._courses_by_title.clear()
        self._majors_by_title.clear()
        self._course_deps_by_course.clear()

    def _parse_semesters(self, sem_str: str) -> List[int]:
        return [int(s.strip()) for s in sem_str.split(",") if s.strip()]

    def _compute_longest_prereq_depth(
        self,
        course_id: str,
        deps_by_course: Dict[str, List[str]],
        visited: Set[str],
        memo: Dict[str, int],
    ) -> int:
        if course_id in memo:
            return memo[course_id]
        if course_id in visited:
            memo[course_id] = 0
            return 0
        visited.add(course_id)
        prereqs = deps_by_course.get(course_id, [])
        if not prereqs:
            memo[course_id] = 0
        else:
            max_depth = max(
                self._compute_longest_prereq_depth(p, deps_by_course, visited, memo)
                for p in prereqs
            )
            memo[course_id] = max_depth + 1
        visited.remove(course_id)
        return memo[course_id]

    def _calculate_recommended_semesters(
        self, courses_csv_path: str, deps_csv_path: str
    ) -> Dict[str, int]:
        courses = {}
        with open(courses_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                courses[row["id"]] = {
                    "semesters": self._parse_semesters(row["available_semesters"]),
                }

        deps_by_course = {}
        with open(deps_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cid = row["course_id"]
                if row["dependency_type"] == "prerequisite":
                    deps_by_course.setdefault(cid, []).append(row["required_course_id"])

        memo = {}
        for cid in courses:
            self._compute_longest_prereq_depth(cid, deps_by_course, set(), memo)

        recommended = {}
        for cid, depth in memo.items():
            course_sems = courses[cid]["semesters"]
            if not course_sems:
                recommended[cid] = depth + 1
                continue
            first_avail = course_sems[0]
            if first_avail % 2 == 1 and first_avail <= depth + 1:
                rec = depth + 1 if (depth + 1) % 2 == 1 else depth + 2
            elif first_avail % 2 == 0 and first_avail <= depth + 1:
                rec = depth + 1 if (depth + 1) % 2 == 0 else depth + 2
            else:
                rec = depth + 1
            rec = max(rec, first_avail)
            recommended[cid] = rec

        return recommended

    async def get_all_courses(self) -> Dict[UUID, CourseData]:
        result = {}
        for cid, course in self._courses.items():
            self._course_deps_by_course.get(cid, [])
            result[cid] = CourseData(
                id=course.id,
                title=course.title,
                description=course.description,
                handbook_link=course.handbook_link,
                course_type=course.course_type,
                category=course.category,
                allowed_cohorts=course.allowed_cohorts,
                available_semesters=course.available_semesters,
                recommended_semester=course.recommended_semester,
                workload=course.workload,
                csat_metric=course.csat_metric,
            )
        return result

    async def get_course_by_id(self, course_id: UUID) -> Optional[CourseData]:
        return self._courses.get(course_id)

    async def get_course_dependencies(self) -> List[CourseDependencyData]:
        return list(self._course_dependencies)

    async def create_course(self, course: CourseData) -> CourseData:
        self._courses[course.id] = course
        self._courses_by_title[course.title] = course.id
        return course

    async def get_all_majors(self) -> Dict[UUID, MajorData]:
        return dict(self._majors)

    async def get_major_by_id(self, major_id: UUID) -> Optional[MajorData]:
        return self._majors.get(major_id)

    async def create_major(self, major: MajorData) -> MajorData:
        self._majors[major.id] = major
        self._majors_by_title[major.title] = major.id
        return major

    async def get_major_requirements(
        self, major_id: UUID
    ) -> List[MajorRequirementData]:
        return [r for r in self._major_requirements if r.major_id == major_id]

    async def create_major_requirement(
        self, req: MajorRequirementData
    ) -> MajorRequirementData:
        self._major_requirements.append(req)
        return req

    async def create_course_dependency(
        self, dep: CourseDependencyData
    ) -> CourseDependencyData:
        self._course_dependencies.append(dep)
        self._course_deps_by_course[dep.course_id].append(dep)
        return dep

    async def get_all_students(self) -> Dict[UUID, StudentData]:
        return dict(self._students)

    async def get_student_by_id(self, student_id: UUID) -> Optional[StudentData]:
        return self._students.get(student_id)

    async def create_student(self, student: StudentData) -> StudentData:
        self._students[student.id] = student
        return student

    async def update_student(self, student: StudentData) -> StudentData:
        self._students[student.id] = student
        return student

    async def load_courses_from_csv(
        self, courses_csv_path: str, deps_csv_path: str, majors_csv_path: str
    ) -> None:
        await self.clear_all()

        recommended = self._calculate_recommended_semesters(
            courses_csv_path, deps_csv_path
        )
        csv_id_to_uuid: Dict[str, UUID] = {}

        with open(courses_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                uid = uuid.uuid4()
                csv_id_to_uuid[row["id"]] = uid
                course = CourseData(
                    id=uid,
                    title=row["title"],
                    description=row["description"],
                    handbook_link=None,
                    course_type=CourseTypeEnum(row["course_type"]),
                    category=CourseCategoryEnum(row["category"]),
                    allowed_cohorts=None,
                    available_semesters=self._parse_semesters(
                        row["available_semesters"]
                    ),
                    recommended_semester=recommended.get(row["id"]),
                    workload=float(row["workload"]),
                    csat_metric=None,
                )
                await self.create_course(course)

        with open(majors_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                uid = uuid.uuid4()
                major = MajorData(
                    id=uid,
                    title=row["title"],
                    school="Tech"
                    if "AI" in row["title"] or "Software" in row["title"]
                    else "Business",
                )
                await self.create_major(major)

        with open(deps_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if (
                    row["course_id"] in csv_id_to_uuid
                    and row["required_course_id"] in csv_id_to_uuid
                ):
                    dep = CourseDependencyData(
                        id=uuid.uuid4(),
                        course_id=csv_id_to_uuid[row["course_id"]],
                        required_course_id=csv_id_to_uuid[row["required_course_id"]],
                        dependency_type=DependencyTypeEnum(row["dependency_type"]),
                    )
                    await self.create_course_dependency(dep)

    async def load_mock_data(self) -> None:
        all_courses = await self.get_all_courses()
        all_majors = await self.get_all_majors()

        courses_by_title = {c.title: c for c in all_courses.values()}
        majors_by_title = {m.title: m for m in all_majors.values()}

        swe_courses = [
            "Разработка на Python. Основной",
            "Разработка на Python. Углублённый",
            "Алгоритмы и структуры данных I",
            "Алгоритмы и структуры данных 2",
            "Архитектура компьютера и ОС",
            "Архитектура компьютера и ОС 2",
            "Базы данных",
            "Основы промышленной разработки",
            "Основы разработки на Go",
            "Web-разработка",
        ]

        ai_courses = [
            "Разработка на Python. Основной",
            "Разработка на Python. Углублённый",
            "Machine Learning",
            "Deep Learning",
            "Введение в ИИ",
            "Теория вероятностей и матстатистика",
            "Математическая статистика",
            "Линейная алгебра и геометрия",
            "Математический анализ",
        ]

        business_courses = [
            "Введение в экономику",
            "Основы бизнес-аналитики",
            "Основы финансов",
            "Микроэкономика I",
            "Макроэкономика I",
            "Основы маркетинга",
            "Теория игр",
            "Эконометрика I",
            "Финансы. Основной уровень",
            "Теория вероятностей и матстатистика",
            "Математическая статистика",
        ]

        common_courses = [
            "Командная работа по Agile",
            "Стресс-менеджмент",
            "Информационная безопасность",
        ]

        mapping = {
            "Software Engineering": swe_courses,
            "AI": ai_courses,
            "Business": business_courses,
            "Common (All Majors)": common_courses,
        }

        for major_title, course_titles in mapping.items():
            if major_title not in majors_by_title:
                continue
            major_id = majors_by_title[major_title].id

            for title in course_titles:
                if title in courses_by_title:
                    req = MajorRequirementData(
                        id=uuid.uuid4(),
                        major_id=major_id,
                        course_id=courses_by_title[title].id,
                        requirement_type=RequirementTypeEnum.core,
                    )
                    await self.create_major_requirement(req)

        if "Software Engineering" in majors_by_title:
            student = StudentData(
                id=uuid.uuid4(),
                cohort=2025,
                current_semester=3,
                target_major_id=majors_by_title["Software Engineering"].id,
                passed_course_ids=[
                    courses_by_title["Разработка на Python. Основной"].id,
                    courses_by_title["Архитектура компьютера и ОС"].id,
                    courses_by_title["Командная работа по Agile"].id,
                ],
            )
            await self.create_student(student)

    async def seed_all_data(self) -> None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        courses_csv = os.path.join(script_dir, "../../courses.csv")
        deps_csv = os.path.join(script_dir, "../../course_dependencies.csv")
        majors_csv = os.path.join(script_dir, "../../majors.csv")

        await self.load_courses_from_csv(courses_csv, deps_csv, majors_csv)
        await self.load_mock_data()

    async def sync_google_sheets_data(self) -> None:
        from src.services.sync.google_sheets import GoogleSheetsService
        from src.services.sync.course_sync import SHEET_TO_MAJOR

        sheets_service = GoogleSheetsService()
        all_sheets_data = sheets_service.get_all_relevant_sheets()

        await self.clear_all()

        course_map: Dict[str, CourseData] = {}
        course_to_majors: Dict[str, List[str]] = {}
        dependency_rows: List[tuple[dict, CourseData]] = []
        majors_by_title: Dict[str, MajorData] = {}

        for sheet_name in all_sheets_data:
            if sheet_name not in SHEET_TO_MAJOR:
                continue

            major_title, school, _ = SHEET_TO_MAJOR[sheet_name]
            major = MajorData(id=uuid.uuid4(), title=major_title, school=school)
            await self.create_major(major)
            majors_by_title[major_title] = major

        for sheet_name, rows in all_sheets_data.items():
            mapping = SHEET_TO_MAJOR.get(sheet_name)
            if mapping is None:
                continue

            major_title, _, category = mapping

            for row in rows:
                raw_title = row.get("Название курса", "").strip()
                if not raw_title:
                    continue

                normalized_title = self._normalize_sheet_title(raw_title)
                course = course_map.get(normalized_title)

                if course is None:
                    course = self._map_sheet_row_to_course(row, category)
                    await self.create_course(course)
                    course_map[normalized_title] = course
                    course_to_majors[normalized_title] = []
                    dependency_rows.append((row, course))

                if major_title not in course_to_majors[normalized_title]:
                    course_to_majors[normalized_title].append(major_title)

        for row, course in dependency_rows:
            await self._create_sheet_dependencies(row, course, course_map)

        for normalized_title, major_titles in course_to_majors.items():
            course = course_map[normalized_title]
            for major_title in major_titles:
                major = majors_by_title.get(major_title)
                if major is None:
                    continue

                await self.create_major_requirement(
                    MajorRequirementData(
                        id=uuid.uuid4(),
                        major_id=major.id,
                        course_id=course.id,
                        requirement_type=RequirementTypeEnum.core,
                    )
                )

    def _normalize_sheet_title(self, raw_title: str) -> str:
        return raw_title.strip()

    def _map_sheet_row_to_course(
        self, row: Dict[str, str], category: CourseCategoryEnum
    ) -> CourseData:
        raw_type = row.get("Тип курса", "").lower()
        if "core" in raw_type or "mandatory" in raw_type:
            course_type = CourseTypeEnum.mandatory
        elif (
            "choice" in raw_type or "elective" in raw_type or "факультатив" in raw_type
        ):
            course_type = CourseTypeEnum.elective
        else:
            course_type = CourseTypeEnum.other

        raw_semester = row.get("Осень / весна", "").lower()
        if "осень" in raw_semester:
            available_semesters = [1, 3, 5, 7]
        elif "весна" in raw_semester:
            available_semesters = [2, 4, 6, 8]
        else:
            available_semesters = [1, 2, 3, 4, 5, 6, 7, 8]

        raw_recommended = str(row.get("Рекомендованный к прохождению семестр", ""))
        recommended_semester = None
        digits = "".join(ch for ch in raw_recommended if ch.isdigit())
        if digits:
            recommended_semester = int(digits)

        raw_workload = str(row.get("Нагрузка", row.get("workload", "5")))
        workload_chars = []
        dot_seen = False
        for char in raw_workload:
            if char.isdigit():
                workload_chars.append(char)
            elif char == "." and not dot_seen:
                workload_chars.append(char)
                dot_seen = True
        workload = float("".join(workload_chars)) if workload_chars else 5.0

        return CourseData(
            id=uuid.uuid4(),
            title=row.get("Название курса", "").strip(),
            description=row.get("Контекст", ""),
            handbook_link=row.get("Силлабус если есть", ""),
            course_type=course_type,
            category=category,
            allowed_cohorts=[2024, 2025, 2026],
            available_semesters=available_semesters,
            recommended_semester=recommended_semester,
            workload=workload,
            csat_metric=None,
        )

    async def _create_sheet_dependencies(
        self,
        row: Dict[str, str],
        course: CourseData,
        course_map: Dict[str, CourseData],
    ) -> None:
        for title in self._split_sheet_titles(row.get("Пререквизиты", "")):
            target = course_map.get(self._normalize_sheet_title(title))
            if target is None:
                continue

            await self.create_course_dependency(
                CourseDependencyData(
                    id=uuid.uuid4(),
                    course_id=course.id,
                    required_course_id=target.id,
                    dependency_type=DependencyTypeEnum.prerequisite,
                )
            )

        for title in self._split_sheet_titles(row.get("Кореквизиты", "")):
            target = course_map.get(self._normalize_sheet_title(title))
            if target is None:
                continue

            await self.create_course_dependency(
                CourseDependencyData(
                    id=uuid.uuid4(),
                    course_id=course.id,
                    required_course_id=target.id,
                    dependency_type=DependencyTypeEnum.corequisite_type1,
                )
            )

    def _split_sheet_titles(self, raw_value: str) -> List[str]:
        if not isinstance(raw_value, str) or not raw_value.strip():
            return []
        return [title.strip() for title in raw_value.split(",") if title.strip()]
