import { Search } from "lucide-react";
import { useState } from "react";

import { Input, Skeleton } from "@/shared/ui";

interface CourseSearchFilterProps {
  search?: string;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
}

export const CourseSearchFilter = ({
  search,
  onSearchChange,
  loading = false,
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
      placeholder="Поиск по названию или описанию"
      value={searchValue}
      onChange={(event) => handleSearchChange(event.target.value)}
    />
  );
};
