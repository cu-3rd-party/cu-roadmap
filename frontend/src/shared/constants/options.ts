export const ADMISSION_YEARS = [2024, 2025, 2026] as const;
export const SEMESTER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const TOTAL_SEMESTERS = 8;

export type AdmissionYear = (typeof ADMISSION_YEARS)[number];
export type SemesterNumber = (typeof SEMESTER_NUMBERS)[number];
