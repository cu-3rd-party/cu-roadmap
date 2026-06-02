export interface PlannedCourse {
  id: string;
  title: string;
  // badge labels carried over when a course is added to a semester
  courseType?: string;
  major?: string;
}
