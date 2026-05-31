export type Season = "autumn" | "spring";

export interface RequisiteItem {
  title: string;
  locked?: boolean;
}

export interface CourseStatus {
  title: string;
  description: string;
}

export interface CourseDetails {
  title: string;
  status?: CourseStatus;
  templan: { label: string; value: string };
  admissionYears: string;
  type: string;
  specialisations: string[];
  seasons: Season[];
  recommendedSemester: string;
  prerequisites: RequisiteItem[];
  postrequisites: RequisiteItem[];
  corequisitesTwoSided: RequisiteItem[];
  corequisitesOneSided: RequisiteItem[];
}

export const MOCK_COURSE_DETAILS: CourseDetails = {
  title: "Основы фронтенд-разработки",
  status: {
    title: "Не все пререквизиты выполнены",
    description: "Нужно пройти: Дискретная математика",
  },
  templan: { label: "О курсе", value: "Темплан" },
  admissionYears: "2026-2030",
  type: "Major core",
  specialisations: ["Мобильная разработка", "Веб-разработка"],
  seasons: ["autumn"],
  recommendedSemester: "1 семестр",
  prerequisites: [
    { title: "Data Stuctures", locked: false },
    { title: "Дискретная математика", locked: true },
  ],
  postrequisites: [{ title: "Data Stuctures" }],
  corequisitesTwoSided: [],
  corequisitesOneSided: [{ title: "Data Stuctures" }],
};
