export {
  getMajors,
  useMajorsQuery,
  useAllMajorsQuery,
  majorsQueryKey,
  identifyMajors,
  useIdentifyMajorsQuery,
  identifyMajorsQueryKey,
} from "./api";
export type {
  MajorDto,
  MajorRequirementDto,
  MajorMatchDto,
  IdentifyMajorsRequestDto,
} from "./api";
export type { Major, MajorMatch } from "./model/types";
export { normalizeMajor, normalizeMajorMatch } from "./lib";
