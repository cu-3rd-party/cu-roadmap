export { REQUISITE_LABELS, REQUISITE_ICONS, type RequisiteType } from "./lib";
export { normalizeCourse } from "./lib";
export {
  buildCourseTitleMap,
  semestersToSeasons,
  courseToDetails,
} from "./lib";
export { CourseCard } from "./ui/CourseCard";
export { DetailsDrawer } from "./ui/DetailsDrawer";
export { getCourses, useCoursesQuery, coursesQueryKey } from "./api";
export type { CourseDto } from "./api";
export type { Course } from "./model/types";
export {
  type CourseDetails,
  type RequisiteItem,
  type Season,
  MOCK_COURSE_DETAILS,
} from "./model/details";
