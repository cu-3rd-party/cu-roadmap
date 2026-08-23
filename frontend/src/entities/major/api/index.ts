export { getMajors } from "./getMajors";
export { getStructure } from "./getStructure";
export {
  useMajorsQuery,
  useAllMajorsQuery,
  majorsQueryKey,
} from "./useMajorsQuery";
export { useStructureQuery, structureQueryKey } from "./useStructureQuery";
export { identifyMajors } from "./identifyMajors";
export {
  useIdentifyMajorsQuery,
  identifyMajorsQueryKey,
} from "./useIdentifyMajorsQuery";
export type {
  MajorDto,
  MajorRequirementDto,
  MajorMatchDto,
  IdentifyMajorsRequestDto,
  StructureSpecializationDto,
  StructureMajorDto,
  StructureYearDto,
  StructureSchoolDto,
} from "./dto";
