from uuid import UUID
from typing import List, Dict, Set, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.domain.models import Course, MajorRequirement, DependencyType
from .validation_service import RoadmapValidator

class PlannerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_courses(self) -> Dict[UUID, Course]:
        res = await self.db.execute(select(Course).options(selectinload(Course.dependencies)))
        return {c.id: c for c in res.scalars().all()}

    async def find_path_to_course(self, 
                                 target_course_id: UUID, 
                                 passed_ids: Set[UUID],
                                 current_semester: int = 1,
                                 max_load: float = 12.0) -> List[Dict]:
        """
        Scenario 4: Generates a plan to reach a specific course as fast as possible.
        """
        all_courses = await self.get_all_courses()
        if target_course_id not in all_courses:
            return [{"error": "Target course not found"}]

        # 1. Collect all necessary dependencies recursively
        needed_ids = set()
        to_check = [target_course_id]
        while to_check:
            curr_id = to_check.pop()
            if curr_id in passed_ids or curr_id in needed_ids:
                continue
            needed_ids.add(curr_id)
            curr_course = all_courses[curr_id]
            for dep in curr_course.dependencies:
                to_check.append(dep.required_course_id)

        # 2. Use a greedy approach to schedule these needed courses
        roadmap = []
        current_sem = current_semester
        courses_todo = {cid: all_courses[cid] for cid in needed_ids}
        current_passed = set(passed_ids)
        
        validator = RoadmapValidator(all_courses)

        while courses_todo:
            available = []
            for cid, c in courses_todo.items():
                # Check prereqs
                can_take = True
                for dep in c.dependencies:
                    if dep.dependency_type == DependencyType.prerequisite and dep.required_course_id not in current_passed:
                        can_take = False
                        break
                if can_take:
                    available.append(c)

            if not available:
                # Potential deadlock or missing data
                roadmap.append({"semester": current_sem, "error": "Cannot satisfy dependencies for remaining courses."})
                break

            # Sort: give priority to courses that are prerequisites for the target or unlock more things
            # For simplicity, we just take as many as fit the load
            sem_courses = []
            sem_load = 0.0
            
            # Offerings check
            is_odd = current_sem % 2 != 0
            
            # Filter by offerings
            available_offered = []
            for c in available:
                if c.available_semesters:
                    course_is_odd = any(s % 2 != 0 for s in c.available_semesters)
                    if is_odd != course_is_odd:
                        continue
                available_offered.append(c)

            if not available_offered:
                 roadmap.append({"semester": current_sem, "courses": [], "status": "Waiting for correct semester offering"})
            else:
                for c in available_offered:
                    if sem_load + c.workload <= max_load:
                        sem_courses.append(c)
                        sem_load += c.workload
                
                for c in sem_courses:
                    current_passed.add(c.id)
                    if c.id in courses_todo:
                        del courses_todo[c.id]

                roadmap.append({
                    "semester": current_sem,
                    "courses": [{"id": str(c.id), "title": c.title, "workload": c.workload} for c in sem_courses],
                    "total_load": sem_load
                })

            current_sem += 1
            if current_sem > 20: break

        return roadmap
