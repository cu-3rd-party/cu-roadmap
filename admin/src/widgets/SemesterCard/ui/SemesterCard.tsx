import { Info } from "lucide-react";
import React from "react";

import type { Course } from "@/shared/config";
import { CourseInfoModal } from "@/shared/ui";

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
    <div
      className="rounded-2xl p-6 min-h-[200px]"
      style={{
        backgroundColor: "var(--color-bg-hover)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className="text-lg font-bold"
          style={{ color: "var(--color-text-main)" }}
        >
          Семестр {semester.semester}
        </h3>
        <span
          className="text-xs px-2 py-1 rounded font-semibold"
          style={{
            backgroundColor: "var(--color-bg-main)",
            color: "var(--color-text-muted)",
          }}
        >
          Нагрузка: {(semester.total_load || 0).toFixed(1)} / 12.0
        </span>
      </div>

      {semester.error && typeof semester.error === "string" && (
        <div className="text-sm mt-2" style={{ color: "#ef4444" }}>
          <span>⚠️ {semester.error}</span>
          {fixPrereq &&
            (semester.error.includes("пререквизиты") ||
              semester.error.includes("prereqs")) && (
              <button
                className="text-white border-none px-2 py-1 rounded text-xs font-bold cursor-pointer ml-2"
                style={{ backgroundColor: "#ef4444" }}
                onClick={() => fixPrereq(semester.error!)}
              >
                ИСПРАВИТЬ
              </button>
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
    </div>
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
  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <>
      <div
        className="rounded-xl p-3 shadow-sm cursor-pointer hover:border-blue-400/50 transition-colors group relative"
        style={{
          backgroundColor: "var(--color-bg-main)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "var(--color-border)",
        }}
        onClick={() => setShowInfo(true)}
      >
        <div className="flex justify-between items-start">
          <strong
            className="font-semibold"
            style={{ color: "var(--color-text-main)" }}
          >
            {course.title}
          </strong>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Info size={12} className="text-blue-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          {course.type && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold"
              style={{
                backgroundColor: "var(--color-bg-hover)",
                color: "var(--color-text-muted)",
              }}
            >
              {course.type}
            </span>
          )}
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
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
