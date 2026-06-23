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
  SpecializationMatchDto,
  IdentifySpecializationsRequestDto,
} from "./api";
export type { Specialization, SpecializationMatch } from "./model/types";
export { normalizeSpecialization, normalizeSpecializationMatch } from "./lib";
