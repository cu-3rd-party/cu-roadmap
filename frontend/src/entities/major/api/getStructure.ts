import { apiClient } from "@/shared/api";

import type { StructureSchoolDto } from "./dto";

// No trailing slash — "majors/structure" is the path Gin registers.
export const getStructure = async (): Promise<StructureSchoolDto[]> =>
  (await apiClient.get<StructureSchoolDto[]>("majors/structure")).data;
