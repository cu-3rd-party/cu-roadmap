import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteCourse } from "@/entities/course";
import { getErrorMessage } from "@/shared/api";

/* Invalidates every admin course list (the key carries the active filters, so
   an exact key would miss the other filter combinations sitting in the cache).

   The failure path is not an edge case: the backend deletes the `courses` row
   and nothing else, so a course still referenced by a box or a dependency trips
   an FK constraint and comes back as a 500. Show it rather than closing the
   modal on a delete that never happened. */
export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      toast.success("Курс удалён");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
