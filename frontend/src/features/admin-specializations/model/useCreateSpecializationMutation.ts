import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { structureQueryKey } from "@/entities/major";
import { createSpecialization } from "@/entities/specialization";
import { getErrorMessage } from "@/shared/api";
import type { UUID } from "@/shared/model";

/* There is no create form — the specialization is born with a placeholder name
   and renamed later from its own editor. */
export const NEW_SPECIALIZATION_TITLE = "Новая специализация";

export const useCreateSpecializationMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (majorId: UUID) =>
      createSpecialization({
        major_id: majorId,
        title: NEW_SPECIALIZATION_TITLE,
      }),
    // No success toast: landing on the new specialization is the feedback.
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: structureQueryKey() });
      navigate(`/admin/specializations/${id}/restrictions`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
