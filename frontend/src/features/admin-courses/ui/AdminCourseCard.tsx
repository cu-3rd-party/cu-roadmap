import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { Course } from "@/entities/course";
import { Button, Separator } from "@/shared/ui/kit";

import { AdminCourseBadges } from "./AdminCourseBadges";

interface AdminCourseCardProps {
  course: Course;
  onDelete: (course: Course) => void;
}

/* The planner course card's shell, with the admin's two actions: the body links
   to the course editor, the footer deletes. Delete is a *sibling* of the link,
   not a child — that is what keeps "click the card" and "click delete" apart
   without nesting one interactive element inside another. */
export const AdminCourseCard = ({ course, onDelete }: AdminCourseCardProps) => (
  <div className="flex h-full flex-col gap-3 rounded-xl bg-background p-2 transition-colors duration-(--std-duration) hover:bg-accent-pale-hover sm:px-3 sm:py-4">
    <Link
      to={`/admin/courses/${course.id}`}
      className="flex flex-1 flex-col gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div
        title={course.title}
        className="h-[3lh] line-clamp-3 text-xs leading-snug font-medium text-fg-primary sm:text-sm"
      >
        {course.title}
      </div>
      <AdminCourseBadges course={course} className="mt-auto" />
    </Link>

    <Separator />

    <Button
      variant="destructive"
      size="xs"
      className="mx-auto"
      icon={<Trash2 size={16} />}
      onClick={() => onDelete(course)}
    >
      Удалить
    </Button>
  </div>
);
