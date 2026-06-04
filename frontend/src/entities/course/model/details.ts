import { UUID } from "@/shared/model";

export type Season = "autumn" | "spring";

export interface RequisiteItem {
  id: UUID;
  title: string;
}

export interface CourseDetails {
  title: string;
  description?: string | null;
  syllabus: string;
  admissionYears: string;
  category: string;
  specialisations: string[];
  seasons: Season[];
  recommendedSemester: string;
  prerequisites: RequisiteItem[];
  postrequisites: RequisiteItem[];
  corequisites: RequisiteItem[];
}

export const MOCK_COURSE_DETAILS: CourseDetails = {
  title: "Основы фронтенд-разработки",
  description:
    "Вводный курс по разработке пользовательских интерфейсов: HTML, CSS и основы JavaScript.",
  syllabus:
    "https://note.cu.ru/space/5eb4b5a4-70b8-4312-89ab-5729678a81a2/article/a5fd270b-937d-51fb-9b80-b3fa0c6dd0e3",
  admissionYears: "2026-2030",
  category: "Fundamentals",
  specialisations: ["Мобильная разработка", "Веб-разработка"],
  seasons: ["autumn"],
  recommendedSemester: "1 семестр",
  prerequisites: [
    { id: "f17cd3d3-a369-49f8-965f-d84ff1cdc44b", title: "Data Stuctures" },
    {
      id: "1fbd053d-8e88-4a81-8cfa-afffc5fff076",
      title: "Дискретная математика",
    },
  ],
  postrequisites: [
    { id: "b1bba545-02fb-435b-9ea0-4cc18484c330", title: "Data Stuctures" },
  ],
  corequisites: [
    { id: "0df0583b-db05-4232-97e2-f5bc7d333087", title: "Data Stuctures" },
  ],
};
