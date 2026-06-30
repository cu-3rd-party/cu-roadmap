export {
  getSpecializations,
  useSpecializationsQuery,
  specializationsQueryKey,
  identifySpecializations,
  useIdentifySpecializationsQuery,
  identifySpecializationsQueryKey,
} from "./api";
export type {
  SpecializationDto,
  SpecializationMatchCourseDto,
  SpecializationMatchDto,
  IdentifySpecializationsRequestDto,
} from "./api";
export type {
  Specialization,
  SpecializationMatch,
  SpecializationMatchCourse,
} from "./model/types";
export { normalizeSpecialization, normalizeSpecializationMatch } from "./lib";
