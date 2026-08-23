export {
  getMajors,
  getStructure,
  useMajorsQuery,
  useAllMajorsQuery,
  majorsQueryKey,
  useStructureQuery,
  structureQueryKey,
  identifyMajors,
  useIdentifyMajorsQuery,
  identifyMajorsQueryKey,
} from "./api";
export type {
  MajorDto,
  MajorRequirementDto,
  MajorMatchDto,
  IdentifyMajorsRequestDto,
  StructureSpecializationDto,
  StructureMajorDto,
  StructureYearDto,
  StructureSchoolDto,
} from "./api";
export type {
  Major,
  MajorMatch,
  StructureSpecialization,
  StructureMajor,
  StructureYear,
} from "./model/types";
export { normalizeMajor, normalizeMajorMatch, normalizeStructure } from "./lib";
