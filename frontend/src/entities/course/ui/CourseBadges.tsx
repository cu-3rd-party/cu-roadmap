import { SemesterNumber } from "@/shared/constants";
import { cn } from "@/shared/lib";
import {
  categorySlugToName,
  categorySlugToShortName,
  CourseCategory,
  CourseType,
  typeSlugToName,
} from "@/shared/model";
import { Badge } from "@/shared/ui/kit";

import type { CourseCardVariant } from "./CourseCard";

interface CourseBadgesProps {
  variant: CourseCardVariant;
  category?: CourseCategory;
  type?: CourseType;
  recommendedSemester?: SemesterNumber | null;
  isMobile: boolean;
  className?: string;
}

export const CourseBadges = ({
  variant,
  category,
  type,
  recommendedSemester,
  isMobile,
  className,
}: CourseBadgesProps) => {
  if (!category && !type) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {category && (
        <Badge variant="orange" size="3xs">
          {variant == "planned" && !isMobile
            ? categorySlugToName[category]
            : categorySlugToShortName[category]}
        </Badge>
      )}
      {type && (
        <Badge variant="blue" size="3xs">
          {typeSlugToName[type]}
        </Badge>
      )}
      {recommendedSemester && (
        <Badge variant="green" size="3xs">
          {"Рек. сем: " + recommendedSemester}
        </Badge>
      )}
    </div>
  );
};
