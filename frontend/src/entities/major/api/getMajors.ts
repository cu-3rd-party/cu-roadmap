import { apiClient } from "@/shared/api";

import type { MajorDto } from "./dto";

export const getMajors = async (): Promise<MajorDto[]> =>
  (await apiClient.get<MajorDto[]>("majors/")).data;
