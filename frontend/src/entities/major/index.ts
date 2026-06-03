export { getMajors, useMajorsQuery, majorsQueryKey, identifyMajors } from "./api";
export type {
  MajorDto,
  MajorRequirementDto,
  MajorMatchDto,
  IdentifyMajorsRequestDto,
} from "./api";
export type { Major, MajorRequirement, MajorMatch } from "./model/types";
export { normalizeMajor, normalizeMajorMatch } from "./lib";
