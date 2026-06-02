import { apiClient } from "@/shared/api";

import type { IdentifyMajorsRequestDto, MajorMatchDto } from "./dto";

export const identifyMajors = async (
  passedCourseIds: IdentifyMajorsRequestDto,
): Promise<MajorMatchDto[]> =>
  (
    await apiClient.post<MajorMatchDto[]>(
      "majors/identify/",
      passedCourseIds,
    )
  ).data;
