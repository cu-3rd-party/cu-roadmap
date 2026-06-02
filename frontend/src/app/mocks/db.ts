import type { CourseDto } from "@/entities/course";
import type { MajorDto } from "@/entities/major";

import { MOCK_COURSES, MOCK_MAJORS } from "./data";

const coursesDb: CourseDto[] = MOCK_COURSES.map((course) => ({ ...course }));
const majorsDb: MajorDto[] = MOCK_MAJORS.map((major) => ({ ...major }));

export const getCoursesDb = (): CourseDto[] =>
  coursesDb.map((course) => ({ ...course }));

export const getMajorsDb = (): MajorDto[] =>
  majorsDb.map((major) => ({ ...major }));
