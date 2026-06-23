import { admissionYearToSemester } from "@/shared/constants";
import type { AdmissionYear } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import { IdentifySpecializationsRequestDto } from "./dto";

export const buildIdentifySpecializationsRequest = (
  courseIds: UUID[],
  admissionYear: AdmissionYear,
  majorId: UUID,
): IdentifySpecializationsRequestDto => {
  return {
    passed_course_ids: courseIds,
    current_semester: admissionYearToSemester[admissionYear],
    major_id: majorId,
  };
};
