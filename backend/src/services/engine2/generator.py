from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.domain.models import Student, Course, MajorRequirement, DependencyType

class GreedyPlanner:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_roadmap(self, passed_course_ids: list[UUID], major_id: UUID, current_semester: int = 1, max_load: float = 20.0):
        # 1. Fetch Major Requirements
        req_res = await self.db.execute(
            select(MajorRequirement)
            .options(selectinload(MajorRequirement.course))
            .where(MajorRequirement.major_id == major_id)
        )
        requirements = req_res.scalars().all()
        if not requirements:
            return {"error": "Major not found or has no requirements"}
        
        target_courses = {req.course_id: req.course for req in requirements}

        # 3. Fetch all courses for dependencies
        all_c_res = await self.db.execute(select(Course).options(selectinload(Course.dependencies)))
        all_courses = {c.id: c for c in all_c_res.scalars().all()}

        passed_ids = set(passed_course_ids)
        
        # Determine courses left to take
        courses_todo = {cid: c for cid, c in target_courses.items() if cid not in passed_ids}

        # Build adjacency lists for counting "how many courses this unlocks"
        unlocks_count = {cid: 0 for cid in all_courses.keys()}
        prereqs = {cid: [] for cid in all_courses.keys()}

        for cid, c in all_courses.items():
            for dep in c.dependencies:
                if dep.dependency_type == DependencyType.prerequisite:
                    prereqs[cid].append(dep.required_course_id)
                    unlocks_count[dep.required_course_id] += 1

        # Simulate semesters starting from current_semester
        current_sem = current_semester
        roadmap = []
        
        while courses_todo:
            available = []
            for cid, c in courses_todo.items():
                can_take = True
                for req_id in prereqs[cid]:
                    if req_id not in passed_ids:
                        can_take = False
                        break
                if can_take:
                    available.append(c)

            if not available:
                missing_info = []
                for cid, c in courses_todo.items():
                    missing = [all_courses[req_id].title for req_id in prereqs[cid] if req_id not in passed_ids]
                    if missing:
                        missing_info.append(f"{c.title} (нужно: {', '.join(missing)})")
                
                error_msg = f"Не хватает пререквизитов: {'; '.join(missing_info[:2])}"
                roadmap.append({"semester": current_sem, "courses": [], "error": error_msg})
                break

            # Sort by unlocks_count (descending)
            available.sort(key=lambda x: unlocks_count[x.id], reverse=True)

            sem_courses = []
            sem_load = 0.0

            for c in available:
                # Check if course is offered in this semester (odd/even)
                if c.available_semesters:
                    is_odd_sem = current_sem % 2 != 0
                    course_is_odd = any(s % 2 != 0 for s in c.available_semesters)
                    if is_odd_sem != course_is_odd:
                        continue 

                if sem_load + c.workload <= max_load:
                    sem_courses.append(c)
                    sem_load += c.workload
                    passed_ids.add(c.id)
                    del courses_todo[c.id]

            if not sem_courses:
                # Might happen if we hit max load exactly or semesters don't align
                pass
            else:
                roadmap.append({
                    "semester": current_sem,
                    "courses": [{"id": str(c.id), "title": c.title, "workload": c.workload, "type": c.course_type.value} for c in sem_courses],
                    "total_load": sem_load
                })

            current_sem += 1
            if current_sem > 12: # Guard against infinite loop
                break

        return roadmap
