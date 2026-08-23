export {
  getSpecializations,
  createSpecialization,
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
  CreateSpecializationRequestDto,
} from "./api";
export type { Specialization, SpecializationMatch } from "./model/types";
export { normalizeSpecialization, normalizeSpecializationMatch } from "./lib";
