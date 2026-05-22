import os
import csv
import uuid
from uuid import UUID
from typing import Dict, List, Optional, Set
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload

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
from ..domain.models import Base, RequirementType
from ..domain.models.course import Course
from ..domain.models.course.course_type import CourseType
from ..domain.models.course.course_category import CourseCategory
from ..domain.models.dependency_type import DependencyType
from ..domain.models.course.course_dependency import CourseDependency
from ..domain.models.major import Major
from ..domain.models.major.major_requirement import MajorRequirement
from ..domain.models.student import Student


class PostgreStore(StoreBase):
    def __init__(self, database_url: Optional[str] = None):
        self._database_url = database_url or os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://roadmap_user:roadmap_password@db:5432/roadmap_db",
        )
        self._engine = None
        self._async_session = None

    async def init(self) -> None:
        self._engine = create_async_engine(self._database_url, echo=False)
        self._async_session = async_sessionmaker(
            self._engine, class_=AsyncSession, expire_on_commit=False
        )
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close(self) -> None:
        if self._engine:
            await self._engine.dispose()

    async def clear_all(self) -> None:
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    @staticmethod
    def _to_course_data(course: Course) -> CourseData:
        return CourseData(
            id=course.id,
            title=course.title,
            description=course.description,
            handbook_link=course.handbook_link,
            course_type=CourseTypeEnum(course.course_type.value),
            category=CourseCategoryEnum(course.category.value),
            allowed_cohorts=course.allowed_cohorts,
            available_semesters=course.available_semesters or [],
            recommended_semester=course.recommended_semester,
            workload=course.workload,
            csat_metric=course.csat_metric,
            prerequisites=[d.required_course_id for d in course.dependencies if d.dependency_type.value == "prerequisite"],
            postrequisites=[]
        )

    @staticmethod
    def _to_major_data(major: Major) -> MajorData:
        return MajorData(
            id=major.id,
            title=major.title,
            school=major.school,
        )

    @staticmethod
    def _to_student_data(student: Student) -> StudentData:
        return StudentData(
            id=student.id,
            cohort=student.cohort,
            current_semester=student.current_semester,
            target_major_id=student.target_major_id,
            passed_course_ids=[c.id for c in student.passed_courses],
        )

    async def get_all_courses(self) -> Dict[UUID, CourseData]:
        async with self._async_session() as session:
            result = await session.execute(
                select(Course).options(selectinload(Course.dependencies))
            )
            courses = result.scalars().all()
            return {c.id: self._to_course_data(c) for c in courses}

    async def get_course_by_id(self, course_id: UUID) -> Optional[CourseData]:
        async with self._async_session() as session:
            result = await session.execute(
                select(Course)
                .where(Course.id == course_id)
                .options(selectinload(Course.dependencies))
            )
            course = result.scalar_one_or_none()
            if course:
                return self._to_course_data(course)
            return None

    async def get_course_dependencies(self) -> List[CourseDependencyData]:
        async with self._async_session() as session:
            result = await session.execute(select(CourseDependency))
            deps = result.scalars().all()
            return [
                CourseDependencyData(
                    id=d.id,
                    course_id=d.course_id,
                    required_course_id=d.required_course_id,
                    dependency_type=DependencyTypeEnum(d.dependency_type.value),
                )
                for d in deps
            ]

    async def create_course(self, course: CourseData) -> CourseData:
        async with self._async_session() as session:
            db_course = Course(
                id=course.id,
                title=course.title,
                description=course.description,
                handbook_link=course.handbook_link,
                course_type=CourseType(course.course_type.value),
                category=CourseCategory(course.category.value),
                allowed_cohorts=course.allowed_cohorts,
                available_semesters=course.available_semesters,
                recommended_semester=course.recommended_semester,
                workload=course.workload,
                csat_metric=course.csat_metric,
            )
            session.add(db_course)
            await session.commit()
            return course

    async def get_all_majors(self) -> Dict[UUID, MajorData]:
        async with self._async_session() as session:
            result = await session.execute(select(Major))
            majors = result.scalars().all()
            return {m.id: self._to_major_data(m) for m in majors}

    async def get_major_by_id(self, major_id: UUID) -> Optional[MajorData]:
        async with self._async_session() as session:
            result = await session.execute(select(Major).where(Major.id == major_id))
            major = result.scalar_one_or_none()
            if major:
                return self._to_major_data(major)
            return None

    async def create_major(self, major: MajorData) -> MajorData:
        async with self._async_session() as session:
            db_major = Major(
                id=major.id,
                title=major.title,
                school=major.school,
            )
            session.add(db_major)
            await session.commit()
            return major

    async def get_major_requirements(
        self, major_id: UUID
    ) -> List[MajorRequirementData]:
        async with self._async_session() as session:
            result = await session.execute(
                select(MajorRequirement).where(MajorRequirement.major_id == major_id)
            )
            reqs = result.scalars().all()
            return [
                MajorRequirementData(
                    id=r.id,
                    major_id=r.major_id,
                    course_id=r.course_id,
                    requirement_type=RequirementTypeEnum(r.requirement_type.value),
                )
                for r in reqs
            ]

    async def create_major_requirement(
        self, req: MajorRequirementData
    ) -> MajorRequirementData:
        async with self._async_session() as session:
            db_req = MajorRequirement(
                id=req.id,
                major_id=req.major_id,
                course_id=req.course_id,
                requirement_type=RequirementType(req.requirement_type.value),
            )
            session.add(db_req)
            await session.commit()
            return req

    async def create_course_dependency(
        self, dep: CourseDependencyData
    ) -> CourseDependencyData:
        async with self._async_session() as session:
            db_dep = CourseDependency(
                id=dep.id,
                course_id=dep.course_id,
                required_course_id=dep.required_course_id,
                dependency_type=DependencyType(dep.dependency_type.value),
            )
            session.add(db_dep)
            await session.commit()
            return dep

    async def get_all_students(self) -> Dict[UUID, StudentData]:
        async with self._async_session() as session:
            result = await session.execute(select(Student))
            students = result.scalars().all()
            return {s.id: self._to_student_data(s) for s in students}

    async def get_student_by_id(self, student_id: UUID) -> Optional[StudentData]:
        async with self._async_session() as session:
            result = await session.execute(
                select(Student).where(Student.id == student_id)
            )
            student = result.scalar_one_or_none()
            if student:
                return self._to_student_data(student)
            return None

    async def create_student(self, student: StudentData) -> StudentData:
        async with self._async_session() as session:
            db_student = Student(
                id=student.id,
                cohort=student.cohort,
                current_semester=student.current_semester,
                target_major_id=student.target_major_id,
            )
            session.add(db_student)
            await session.commit()
            return student

    async def update_student(self, student: StudentData) -> StudentData:
        async with self._async_session() as session:
            result = await session.execute(
                select(Student).where(Student.id == student.id)
            )
            db_student = result.scalar_one_or_none()
            if db_student:
                db_student.cohort = student.cohort
                db_student.current_semester = student.current_semester
                db_student.target_major_id = student.target_major_id
                await session.commit()
            return student

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

    async def load_courses_from_csv(
        self, courses_csv_path: str, deps_csv_path: str, majors_csv_path: str
    ) -> None:
        await self.clear_all()

        recommended = self._calculate_recommended_semesters(
            courses_csv_path, deps_csv_path
        )
        course_map: Dict[str, UUID] = {}
        major_map: Dict[str, UUID] = {}

        async with self._async_session() as session:
            with open(courses_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    uid = uuid.uuid4()
                    course_map[row["id"]] = uid
                    course = Course(
                        id=uid,
                        title=row["title"],
                        description=row["description"],
                        available_semesters=self._parse_semesters(
                            row["available_semesters"]
                        ),
                        course_type=CourseType(row["course_type"]),
                        category=CourseCategory(row["category"]),
                        workload=float(row["workload"]),
                        recommended_semester=recommended.get(row["id"]),
                    )
                    session.add(course)

            with open(majors_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    uid = uuid.uuid4()
                    major_map[row["id"]] = uid
                    major = Major(
                        id=uid,
                        title=row["title"],
                        school="Tech"
                        if "AI" in row["title"] or "Software" in row["title"]
                        else "Business",
                    )
                    session.add(major)

            with open(deps_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if (
                        row["course_id"] in course_map
                        and row["required_course_id"] in course_map
                    ):
                        dep = CourseDependency(
                            course_id=course_map[row["course_id"]],
                            required_course_id=course_map[row["required_course_id"]],
                            dependency_type=DependencyType(row["dependency_type"]),
                        )
                        session.add(dep)

            await session.commit()

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
        """Seed database from Google Sheets. Falls back to CSV+mock if unavailable."""
        if await self._try_seed_from_google_sheets():
            return
        # Fallback: CSV files + hardcoded mock major_requirements
        print("Google Sheets unavailable — falling back to CSV seed.")
        script_dir = os.path.dirname(os.path.abspath(__file__))
        courses_csv = os.path.join(script_dir, "../../courses.csv")
        deps_csv = os.path.join(script_dir, "../../course_dependencies.csv")
        majors_csv = os.path.join(script_dir, "../../majors.csv")
        await self.load_courses_from_csv(courses_csv, deps_csv, majors_csv)
        await self.load_mock_data()

    async def _try_seed_from_google_sheets(self) -> bool:
        """Attempt to sync from Google Sheets. Returns True on success."""
        try:
            await self.sync_google_sheets_data()
            return True
        except Exception as e:
            print(f"Google Sheets sync failed: {e}")
            return False

    async def sync_google_sheets_data(self) -> None:
        from src.services.sync.course_sync import CourseSyncService

        async with self._async_session() as session:
            sync = CourseSyncService(session)
            stats = await sync.sync_all()

        print(
            f"Google Sheets sync complete - "
            f"courses: {stats['courses']}, "
            f"majors: {stats['majors']}, "
            f"major_requirements: {stats['major_requirements']}"
        )
