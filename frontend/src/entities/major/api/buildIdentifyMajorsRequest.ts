import { admissionYearToSemester } from "@/shared/constants";
import type { AdmissionYear } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import { IdentifyMajorsRequestDto } from "./dto";

export const buildIdentifyMajorsRequest = (
  courseIds: UUID[],
  admissionYear: AdmissionYear,
): IdentifyMajorsRequestDto => {
  return {
    passed_course_ids: courseIds,
    current_semester: admissionYearToSemester[admissionYear],
  };
};
