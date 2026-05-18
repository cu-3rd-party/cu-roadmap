import type { Course } from "@/entities/course";
import type { ValidationResult } from "@/shared/config";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/kit/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

import type { ManualSemester } from "../lib/useManualRoadmapState";

import { ManualCourseItem } from "./ManualCourseItem";

interface SemesterEditorProps {
  semester: ManualSemester;
  semesterIndex: number;
  courses: Course[];
  allRoadmap: ManualSemester[];
  validation?: ValidationResult;
  onAdd: (semIdx: number, courseId: string) => void;
  onRemove: (semIdx: number, courseId: string) => void;
}

export function SemesterEditor({
  semester,
  semesterIndex,
  courses,
  allRoadmap,
  validation,
  onAdd,
  onRemove,
}: SemesterEditorProps) {
  const overloaded = validation && validation.total_load > 12;

  return (
    <Card
      className={cn(
        "min-h-[200px] gap-3",
        validation && !validation.valid && "ring-destructive",
      )}
    >
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-bold">
          Семестр {semester.semester}
        </CardTitle>
        {validation && (
          <Badge variant={overloaded ? "destructive" : "secondary"}>
            Нагрузка: {validation.total_load.toFixed(1)}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {validation?.messages.map((m, midx) => (
          <div
            key={midx}
            className={cn(
              "text-sm",
              m.level === "error"
                ? "text-destructive"
                : "text-yellow-badge-foreground",
            )}
          >
            {m.level === "error" ? "❌" : "⚠️"} {m.message}
          </div>
        ))}

        <div
          className="grid gap-3 min-h-[60px] p-3 rounded-xl bg-background"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {semester.course_ids.map((cid) => {
            const c = courses.find((item) => item.id === cid);
            if (!c) return null;
            return (
              <ManualCourseItem
                key={cid}
                course={c}
                allCourses={courses}
                onRemove={() => onRemove(semesterIndex, cid)}
              />
            );
          })}
        </div>

        <Select onValueChange={(value) => onAdd(semesterIndex, value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="+ Добавить курс" />
          </SelectTrigger>
          <SelectContent>
            {courses
              .filter(
                (c) => !allRoadmap.some((s) => s.course_ids.includes(c.id)),
              )
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
