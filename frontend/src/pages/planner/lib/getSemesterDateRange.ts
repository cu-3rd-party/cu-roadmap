import type { AdmissionYear } from "@/shared/constants";

// Derives a human-readable date range for a semester from the admission year.
export const getSemesterDateRange = (
  admissionYear: AdmissionYear | null,
  semester: number,
): string => {
  if (admissionYear == null) return "";
  if (semester % 2 === 1) {
    const start = admissionYear + (semester - 1) / 2;
    return `Сентябрь ${start} - Январь ${start + 1}`;
  }
  const year = admissionYear + semester / 2;
  return `Февраль ${year} - Июнь ${year}`;
};
