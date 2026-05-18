import { Info } from "lucide-react";
import { useState } from "react";

import { CourseInfoModal, type Course } from "@/entities/course";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";

interface SemesterCardProps {
  semester: {
    semester: number;
    total_load?: number;
    error?: string;
    courses: Course[];
  };
  fixPrereq?: (courseTitle: string) => void;
  allCourses: Course[];
  passedIds?: string[];
}

export function SemesterCard({
  semester,
  fixPrereq,
  allCourses,
  passedIds = [],
}: SemesterCardProps) {
  return (
    <Card className="min-h-[200px] gap-3">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-bold">
          Семестр {semester.semester}
        </CardTitle>
        <Badge variant="secondary">
          Нагрузка: {(semester.total_load || 0).toFixed(1)} / 12.0
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {semester.error && typeof semester.error === "string" && (
          <div className="text-sm text-destructive flex items-center gap-2">
            <span>⚠️ {semester.error}</span>
            {fixPrereq &&
              (semester.error.includes("пререквизиты") ||
                semester.error.includes("prereqs")) && (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => fixPrereq(semester.error!)}
                >
                  ИСПРАВИТЬ
                </Button>
              )}
          </div>
        )}

        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {semester.courses.map((c) => (
            <CourseItem
              key={c.id}
              course={c}
              allCourses={allCourses}
              passedIds={passedIds}
              currentSemester={semester.semester}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CourseItem({
  course,
  allCourses,
  passedIds,
  currentSemester,
}: {
  course: Course;
  allCourses: Course[];
  passedIds: string[];
  currentSemester: number;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <div
        className="rounded-xl p-3 shadow-sm cursor-pointer border border-border bg-background hover:border-primary/50 transition-colors group relative"
        onClick={() => setShowInfo(true)}
      >
        <div className="flex justify-between items-start">
          <strong className="font-semibold text-foreground">
            {course.title}
          </strong>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Info size={12} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          {course.type && (
            <Badge variant="secondary" className="text-xs">
              {course.type}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {course.workload} к.
          </span>
        </div>
      </div>

      {showInfo && (
        <CourseInfoModal
          course={course}
          allCourses={allCourses}
          passedIds={passedIds}
          currentSemester={currentSemester}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
