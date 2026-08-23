import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  createDisciplineGroup,
  disciplineGroupsQueryKey,
} from "@/entities/disciplineGroup";
import type { DisciplineGroupRequestDto } from "@/entities/disciplineGroup";
import { getErrorMessage } from "@/shared/api";

/* The stub a fresh box starts as. `math_expression` has to be spelled out even
   though it is empty — the Go binding marks it required, so an omitted field is
   a 400 rather than a default. An empty tree means the card renders "0 объектов"
   and no rule badge, which is the honest state of a box nobody has filled yet.

   Category is left blank on purpose: it is a free-form varchar whose live values
   ("prerequisite", "corequisite", "analog_group") all describe how a box got
   generated, and none of them fit one an admin made by hand. */
const NEW_GROUP: DisciplineGroupRequestDto = {
  title: "Новая коробка",
  category: "",
  math_expression: {},
};

/* Creates the stub and jumps straight into its editor — same shape as
   useCreateCourseMutation, including the missing success toast: the navigation is
   the feedback, and a toast would land on a screen the user is already leaving.

   The POST answers with the whole group rather than just an id, so `created` is
   the full DTO. Only the id is needed here; the editor refetches. */
export const useCreateDisciplineGroupMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => createDisciplineGroup(NEW_GROUP),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: disciplineGroupsQueryKey() });
      navigate(`/admin/boxes/${created.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export { NEW_GROUP };
