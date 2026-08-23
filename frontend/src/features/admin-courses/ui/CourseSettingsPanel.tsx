import {
  ClearChip,
  FilterCard,
  SEMESTER_OPTIONS,
} from "@/features/course-filters";
import { ADMISSION_YEARS } from "@/shared/constants";
import {
  Chip,
  CollapsiblePanel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import { CATEGORY_FILTER_LABELS, CATEGORY_FILTER_OPTIONS } from "../model";

// Lectures/seminars per week. "0" is a real option: a course can be seminar-only.
const PER_WEEK_OPTIONS = ["0", "1", "2", "3", "4"] as const;

const YEAR_OPTIONS = ADMISSION_YEARS.map(String);

interface CourseSettingsPanelProps {
  year: string;
  courseType: string;
  allowedSemesters: string[];
  lecturesWeek: string;
  seminarsWeek: string;
  onYearChange: (value: string) => void;
  onCourseTypeChange: (value: string) => void;
  onToggleSemester: (semester: string) => void;
  onClearSemesters: () => void;
  onLecturesWeekChange: (value: string) => void;
  onSeminarsWeekChange: (value: string) => void;
}

const SegmentedTabs = ({
  options,
  value,
  onValueChange,
}: {
  options: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
}) => (
  <Tabs value={value} onValueChange={onValueChange}>
    {/* Equal-width pills, same as every other segmented row in the app. */}
    <TabsList className="grid grid-flow-col auto-cols-fr">
      {options.map((option) => (
        <TabsTrigger key={option} value={option}>
          {option}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

/* The catalog's gray filters card, reused as the course's settings block. Every control
   is local state for now — nothing here is persisted. */
export const CourseSettingsPanel = ({
  year,
  courseType,
  allowedSemesters,
  lecturesWeek,
  seminarsWeek,
  onYearChange,
  onCourseTypeChange,
  onToggleSemester,
  onClearSemesters,
  onLecturesWeekChange,
  onSeminarsWeekChange,
}: CourseSettingsPanelProps) => (
  <CollapsiblePanel title="Настройки">
    <div className="flex flex-col gap-1">
      <div className="grid gap-1 sm:grid-cols-2">
        <FilterCard label="Год проведения курса">
          <SegmentedTabs
            options={YEAR_OPTIONS}
            value={year}
            onValueChange={onYearChange}
          />
        </FilterCard>

        <FilterCard label="Тип курса">
          <Select value={courseType} onValueChange={onCourseTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_FILTER_OPTIONS.map((category) => (
                <SelectItem key={category} value={category}>
                  {CATEGORY_FILTER_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterCard>
      </div>

      <div className="grid gap-1 sm:grid-cols-3">
        <FilterCard label="Разрешенные семестры">
          <div className="flex flex-wrap gap-2">
            {SEMESTER_OPTIONS.map((semester) => (
              <Chip
                variant="action"
                key={semester}
                size="xs"
                active={allowedSemesters.includes(semester)}
                onClick={() => onToggleSemester(semester)}
                className="rounded-full size-8"
              >
                {semester}
              </Chip>
            ))}
            {allowedSemesters.length > 0 && (
              <ClearChip onClick={onClearSemesters} />
            )}
          </div>
        </FilterCard>

        <FilterCard label="Лекций в неделю">
          <SegmentedTabs
            options={PER_WEEK_OPTIONS}
            value={lecturesWeek}
            onValueChange={onLecturesWeekChange}
          />
        </FilterCard>

        <FilterCard label="Семинаров в неделю">
          <SegmentedTabs
            options={PER_WEEK_OPTIONS}
            value={seminarsWeek}
            onValueChange={onSeminarsWeekChange}
          />
        </FilterCard>
      </div>
    </div>
  </CollapsiblePanel>
);
