import type {
  GenerateRoadmapResponseDto,
  GoalPathResponseDto,
  RoadmapSemesterDto,
  ValidateRoadmapResponseDto,
  ValidationMessageDto,
  ValidationResultDto,
} from "../api";
import type { Roadmap, RoadmapSemester, RoadmapValidation, SemesterValidation, ValidationMessage } from "../model";

const normalizeRoadmapSemester = (
  dto: RoadmapSemesterDto
): RoadmapSemester => {
  return {
    semester: dto.semester,
    totalLoad: dto.total_load,
    courses: dto.courses
  }
}

export const normalizeRoadmap = (
  dto: GenerateRoadmapResponseDto | GoalPathResponseDto,
): Roadmap => {
  return {
    error: dto.error,
    semesters: dto.roadmap.map(sem => normalizeRoadmapSemester(sem))
  }
};

const normalizeValidationMessage = (
  dto: ValidationMessageDto
): ValidationMessage => {
  return {
    level: dto.level,
    message: dto.message,
    courseId: dto.course_id
  }
}

export const normalizeValidationResult = (
  dto: ValidationResultDto,
): SemesterValidation => {
  return {
    semester: dto.semester,
    valid: dto.valid,
    totalLoad: dto.total_load,
    messages: dto.messages.map(mes => normalizeValidationMessage(mes))
  }
};

export const normalizeValidationRoadmap = (
  dto: ValidateRoadmapResponseDto
): RoadmapValidation => dto.validation_results.map(res => normalizeValidationResult(res))