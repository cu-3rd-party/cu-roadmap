export const ADMISSION_YEARS = [2023, 2024, 2025, 2026] as const;

export type AdmissionYear = (typeof ADMISSION_YEARS)[number];