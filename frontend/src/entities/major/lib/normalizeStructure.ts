import type { StructureMajorDto, StructureSchoolDto } from "../api/dto";
import type {
  StructureMajor,
  StructureSpecialization,
  StructureYear,
} from "../model/types";

const byTitle = (a: { title: string }, b: { title: string }): number =>
  a.title.localeCompare(b.title);

const normalizeMajorNode = (dto: StructureMajorDto): StructureMajor => ({
  id: dto.id,
  title: dto.title,
  type: dto.internal_name,
  specializations: (dto.specializations ?? [])
    .map(({ id, title }): StructureSpecialization => ({ id, title }))
    .sort(byTitle),
});

/* Flattens the school -> year -> majors tree into a year -> majors list: the
   admin screen has no school dimension, so every school's majors land in the
   same year bucket.

   Sorting is not cosmetic. getStructure builds its response from nested Go maps
   and iterates them unsorted, so schools, years and majors come back in a
   different order on every request. */
export const normalizeStructure = (
  dtos: StructureSchoolDto[],
): StructureYear[] => {
  const majorsByYear = new Map<number, StructureMajor[]>();

  for (const school of dtos) {
    for (const { year, majors } of school.cohort_years ?? []) {
      const bucket = majorsByYear.get(year) ?? [];
      bucket.push(...(majors ?? []).map(normalizeMajorNode));
      majorsByYear.set(year, bucket);
    }
  }

  return [...majorsByYear.entries()]
    .map(([year, majors]) => ({ year, majors: majors.sort(byTitle) }))
    .sort((a, b) => a.year - b.year);
};
