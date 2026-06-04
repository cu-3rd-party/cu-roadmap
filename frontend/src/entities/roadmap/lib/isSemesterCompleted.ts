import {
  admissionYearToSemester,
  type AdmissionYear,
} from "@/shared/constants";

// A semester is "completed" when it sits before the user's current semester,
export const isSemesterCompleted = (
  semester: number,
  admissionYear: AdmissionYear,
): boolean => semester < admissionYearToSemester[admissionYear];
