import { Search } from "lucide-react";
import { useState } from "react";

import { Input, Skeleton } from "@/shared/ui";

interface CourseSearchFilterProps {
  search?: string;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
  /* Defaults to the catalog wording. Discipline groups carry no description, so
     the Коробки grid passes a narrower one rather than promising a match it
     cannot make. */
  placeholder?: string;
}

export const CourseSearchFilter = ({
  search,
  onSearchChange,
  loading = false,
  placeholder = "Поиск по названию или описанию",
}: CourseSearchFilterProps) => {
  const [localSearch, setLocalSearch] = useState("");

  const searchValue = search ?? localSearch;

  const handleSearchChange = (value: string) =>
    onSearchChange ? onSearchChange(value) : setLocalSearch(value);

  if (loading) {
    return <Skeleton className="h-10 w-full rounded-xl" />;
  }

  return (
    <Input
      icon={<Search />}
      placeholder={placeholder}
      value={searchValue}
      onChange={(event) => handleSearchChange(event.target.value)}
    />
  );
};
