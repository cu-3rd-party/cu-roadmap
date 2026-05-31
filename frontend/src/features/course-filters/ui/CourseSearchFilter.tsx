import { Search } from "lucide-react";

import { Chip } from "@/shared/ui/kit/chip";
import { Counter } from "@/shared/ui/kit/counter";
import { Input } from "@/shared/ui/kit/input";

import { CATEGORY_FILTERS, type CategoryFilterOption } from "../model/options";

interface CourseSearchFilterProps {
  categories?: CategoryFilterOption[];
}

export const CourseSearchFilter = ({
  categories = CATEGORY_FILTERS,
}: CourseSearchFilterProps) => (
  <>
    <Input icon={<Search />} placeholder="Поиск по названию или описанию" />
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Chip key={category.label} variant="counter" size="xs">
          {category.label}
          <Counter variant="primary" size="xxs">
            {category.count}
          </Counter>
        </Chip>
      ))}
    </div>
  </>
);
