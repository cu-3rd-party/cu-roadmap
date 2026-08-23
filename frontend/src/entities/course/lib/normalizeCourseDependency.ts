import type { CourseDependencyDto } from "../api/dto";
import type { CourseDependency } from "../model/dependencies";

export const normalizeCourseDependency = (
  dto: CourseDependencyDto,
): CourseDependency => ({
  id: dto.id,
  courseId: dto.course_id,
  requiredCourseId: dto.required_course_id ?? null,
  requiredGroupId: dto.required_group_id ?? null,
  type: dto.dependency_type,
  alternativeGroup: dto.alternative_group ?? 0,
});
