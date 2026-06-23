import { admissionYearToSemester } from "@/shared/constants";
import type { AdmissionYear } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import { IdentifySpecializationsRequestDto } from "./dto";

export const buildIdentifySpecializationsRequest = (
  courseIds: UUID[],
  admissionYear: AdmissionYear,
): IdentifySpecializationsRequestDto => {
  return {
    passed_course_ids: courseIds,
    current_semester: admissionYearToSemester[admissionYear],
  };
};
