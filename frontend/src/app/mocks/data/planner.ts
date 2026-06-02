import type { CourseDto } from "@/entities/course";
import type { MajorMatchDto } from "@/entities/major";
import type {
  GenerateRoadmapResponseDto,
  RoadmapCourseDto,
  ValidationResultDto,
} from "@/entities/roadmap";

import { MOCK_COURSES } from "./courses";

const courseById = (id: string): CourseDto | undefined =>
  MOCK_COURSES.find((c) => c.id === id);

const pick = (...ids: string[]): RoadmapCourseDto[] =>
  ids
    .map(courseById)
    .filter((c): c is CourseDto => Boolean(c))
    .map((c) => ({
      id: c.id,
      title: c.title,
      workload: c.workload,
      type: c.course_type,
    }));

const sumLoad = (courses: RoadmapCourseDto[]): number =>
  courses.reduce((acc, c) => acc + c.workload, 0);

const sem1 = pick(
  "8c3ff068-c93e-4eca-9034-c33c541a6862", // Python Основной
  "701f118e-ca1a-45ff-a17c-ed7dab8ee96f", // Линал
  "7d1a1ebb-2880-45b6-bcc2-e65f04f667c2", // Матан
);
const sem2 = pick(
  "4c7fee5c-5876-43ad-9a83-5e4e649a6e17", // Введение в ИИ
  "ed1445db-88f2-4b0b-a11a-27c5fefa07d9", // Дискретка
  "11365ca8-ee89-4cda-b6ee-67342d18471e", // Матстат
);
const sem3 = pick(
  "1e7e1040-d9c2-4ebf-8570-5fc71ef48cf6", // Python Углублённый
  "dd406393-7065-448c-af04-33e99615fe85", // ML
  "0eacc55e-39ee-4574-8d38-08682206ad76", // Теорвер
);
const sem4 = pick(
  "04fc9632-ecdf-4629-8d16-d3963af5b3d3", // Deep Learning
  "4e5f4ec3-2572-4690-9eba-704f924cecc7", // Алгоритмы 2
  "a804aa38-d91d-43fa-9590-fa79b8a46e7b", // Многопоточность
);

export const MOCK_ROADMAP: GenerateRoadmapResponseDto = {
  major_id: "a24aa7f7-e004-4942-8062-ef2a52b2debc",
  roadmap: [
    { semester: 1, total_load: sumLoad(sem1), courses: sem1 },
    { semester: 2, total_load: sumLoad(sem2), courses: sem2 },
    { semester: 3, total_load: sumLoad(sem3), courses: sem3 },
    { semester: 4, total_load: sumLoad(sem4), courses: sem4 },
  ],
};

export const MOCK_MAJOR_RESULTS: MajorMatchDto[] = [
  {
    id: "a24aa7f7-e004-4942-8062-ef2a52b2debc",
    title: "AI",
    score: 0.82,
    covered_count: 9,
    total_count: 11,
  },
  {
    id: "58d9f79d-35c6-4247-9435-38844a2aba6b",
    title: "Software Engineering",
    score: 0.64,
    covered_count: 7,
    total_count: 11,
  },
  {
    id: "bd5e402f-1121-4f5c-84b2-ad328cb952d3",
    title: "Business",
    score: 0.31,
    covered_count: 3,
    total_count: 11,
  },
];

export const MOCK_VALIDATION: ValidationResultDto[] = [
  {
    semester: 1,
    valid: true,
    total_load: 12.0,
    messages: [{ level: "info", message: "Нагрузка в пределах нормы." }],
  },
  {
    semester: 2,
    valid: true,
    total_load: 12.0,
    messages: [],
  },
  {
    semester: 3,
    valid: true,
    total_load: 12.0,
    messages: [],
  },
  {
    semester: 4,
    valid: true,
    total_load: 12.0,
    messages: [],
  },
];
