from uuid import UUID
from typing import List, Dict, Set
from collections import defaultdict

from ..stores.factory import get_store
from ..stores.base import (
    StoreBase,
    CourseData,
    CourseDependencyData,
    DependencyTypeEnum,
)
from ..domain.schemas import ValidationMessage
from ..domain.schemas.validation.validation_result import ValidationResult


class RoadmapValidator:
    def __init__(
        self,
        all_courses: Dict[UUID, CourseData],
        deps_by_course: Dict[UUID, List[CourseDependencyData]] = None,
    ):
        self.all_courses = all_courses
        self.deps_by_course = deps_by_course or defaultdict(list)

    async def load_dependencies(self, store: StoreBase) -> None:
        deps = await store.get_course_dependencies()
        self.deps_by_course = defaultdict(list)
        for dep in deps:
            self.deps_by_course[dep.course_id].append(dep)

    @staticmethod
    async def create_from_store(store: StoreBase = None) -> "RoadmapValidator":
        if store is None:
            store = await get_store()
        all_courses = await store.get_all_courses()
        validator = RoadmapValidator(all_courses)
        await validator.load_dependencies(store)
        return validator

    def validate_semester(
        self,
        courses_in_sem: List[CourseData],
        previously_passed_ids: Set[UUID],
        current_sem_num: int,
        max_load: float = 12.0,
    ) -> ValidationResult:
        messages = []
        total_load = sum(c.workload for c in courses_in_sem)
        in_sem_ids = {c.id for c in courses_in_sem}

        # 1. Check workload
        if total_load > max_load:
            messages.append(
                ValidationMessage(
                    level="warning",
                    message=f"Превышена нагрузка ({total_load:.1f} > {max_load:.1f})",
                )
            )

        # 2. Check offering semesters
        is_odd = current_sem_num % 2 != 0
        for c in courses_in_sem:
            if c.available_semesters:
                course_is_odd = any(s % 2 != 0 for s in c.available_semesters)
                if is_odd != course_is_odd:
                    messages.append(
                        ValidationMessage(
                            level="error",
                            message=f"Курс '{c.title}' не читается в {current_sem_num}-м семестре",
                            course_id=c.id,
                        )
                    )

        # 3. Check Dependencies
        for c in courses_in_sem:
            for dep in self.deps_by_course.get(c.id, []):
                req_id = dep.required_course_id
                req_title = (
                    self.all_courses[req_id].title
                    if req_id in self.all_courses
                    else "Неизвестный курс"
                )

                if dep.dependency_type == DependencyTypeEnum.prerequisite:
                    if req_id not in previously_passed_ids:
                        messages.append(
                            ValidationMessage(
                                level="error",
                                message=f"Для '{c.title}' нужен пререквизит: {req_title}",
                                course_id=c.id,
                            )
                        )

                elif dep.dependency_type == DependencyTypeEnum.corequisite:
                    # Must be in the same semester
                    if req_id not in in_sem_ids:
                        messages.append(
                            ValidationMessage(
                                level="error",
                                message=f"'{c.title}' и '{req_title}' должны изучаться одновременно",
                                course_id=c.id,
                            )
                        )

        is_valid = not any(m.level == "error" for m in messages)
        return ValidationResult(
            is_valid=is_valid, messages=messages, total_load=total_load
        )

    def validate_full_roadmap(
        self,
        roadmap_data: List[Dict],
        initial_passed_ids: Set[UUID],
        max_load: float = 12.0,
    ) -> List[Dict]:
        """
        Validates a full roadmap (list of semesters with course IDs).
        """
        results = []
        current_passed = set(initial_passed_ids)

        for sem_data in roadmap_data:
            # Handle both dict and Pydantic model
            if hasattr(sem_data, "semester"):
                sem_num = sem_data.semester
                course_ids = sem_data.course_ids
            else:
                sem_num = sem_data.get("semester")
                course_ids = sem_data.get("course_ids", [])

            courses = [
                self.all_courses[cid] for cid in course_ids if cid in self.all_courses
            ]

            res = self.validate_semester(courses, current_passed, sem_num, max_load)

            results.append(
                {
                    "semester": sem_num,
                    "valid": res.is_valid,
                    "total_load": res.total_load,
                    "messages": [m.dict() for m in res.messages],
                }
            )

            # Update passed for next semester
            for c in courses:
                current_passed.add(c.id)

        return results
