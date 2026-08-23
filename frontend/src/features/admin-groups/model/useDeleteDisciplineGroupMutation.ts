import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteDisciplineGroup,
  disciplineGroupsQueryKey,
} from "@/entities/disciplineGroup";
import { getErrorMessage } from "@/shared/api";

/* The failure path is not an edge case. Deleting a box wipes its box tree and
   root box, but a box still named by a course dependency trips an FK constraint
   and comes back as a 500 — show it rather than closing the modal on a delete
   that never happened. */
export const useDeleteDisciplineGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDisciplineGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineGroupsQueryKey() });
      toast.success("Коробка удалена");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
