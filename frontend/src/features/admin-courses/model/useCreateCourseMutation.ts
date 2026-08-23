import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { createCourse } from "@/entities/course";
import type { CreateCourseRequestDto } from "@/entities/course";
import { getErrorMessage } from "@/shared/api";
import { ADMISSION_YEARS } from "@/shared/constants";

/* The stub a fresh course starts as. Category is set rather than left at the
   backend's zero value so the card renders a real badge the moment it exists —
   `fundamentals` is what the admin filter spells "Другое". The cohort tracks
   ADMISSION_YEARS instead of hardcoding a year. */
const NEW_COURSE: CreateCourseRequestDto = {
  title: "Новый курс",
  category: "fundamentals",
  allowed_cohorts: [ADMISSION_YEARS[ADMISSION_YEARS.length - 1]],
};

/* Creates the stub and jumps straight into its editor. No success toast: the
   navigation is the feedback, and the toast would land on a screen the user is
   already leaving. Invalidation still matters — coming back must show the card. */
export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => createCourse(NEW_COURSE),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      navigate(`/admin/courses/${id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export { NEW_COURSE };
