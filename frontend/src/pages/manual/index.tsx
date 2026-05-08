import React, { useEffect, useState } from "react";
import { api, type Course, type ValidationResult } from "@/shared/config";
import { Trash } from "lucide-react";

interface ManualPageProps {
  passedIds: string[];
  roadmap: { semester: number; course_ids: string[] }[];
  setRoadmap: React.Dispatch<React.SetStateAction<{ semester: number; course_ids: string[] }[]>>;
}

export function ManualPage({ passedIds, roadmap, setRoadmap }: ManualPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [validation, setValidation] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCourses().then((res) => setCourses(res.data));
  }, []);

  const validate = () => {
    setLoading(true);
    api.validateRoadmap({
      passed_course_ids: passedIds,
      roadmap,
      max_load: 12.0,
    }).then((res) => {
      setValidation(res.data.validation_results);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  const addCourse = (semIdx: number, courseId: string) => {
    if (!courseId) return;
    const newRoadmap = [...roadmap];
    if (!newRoadmap[semIdx].course_ids.includes(courseId)) {
      newRoadmap[semIdx].course_ids = [...newRoadmap[semIdx].course_ids, courseId];
      setRoadmap(newRoadmap);
    }
  };

  const removeCourse = (semIdx: number, courseId: string) => {
    const newRoadmap = [...roadmap];
    newRoadmap[semIdx].course_ids = newRoadmap[semIdx].course_ids.filter((id: string) => id !== courseId);
    setRoadmap(newRoadmap);
  };

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-text-main)" }}>
        Песочница (Ручное планирование)
      </h1>
      <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
        Расставьте курсы по семестрам самостоятельно и проверьте план на корректность.
      </p>

      <div className="mb-6">
        <button
          className="text-white border-none px-4 py-2 rounded-lg font-bold text-sm cursor-pointer"
          style={{ backgroundColor: "var(--color-primary)" }}
          onClick={validate}
          disabled={loading}
        >
          {loading ? "Проверяем..." : "Проверить план"}
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {roadmap.map((sem, idx: number) => {
          const v = validation.find((res) => res.semester === sem.semester);
          return (
            <div
              key={idx}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "var(--color-bg-hover)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: v && !v.valid ? "#ef4444" : "var(--color-border)",
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: "var(--color-text-main)" }}>
                  Семестр {sem.semester}
                </h3>
                {v && (
                  <span
                    className="text-xs px-2 py-1 rounded font-semibold"
                    style={{
                      backgroundColor: v.total_load > 12 ? "rgba(239,68,68,0.2)" : "var(--color-bg-main)",
                      color: v.total_load > 12 ? "#ef4444" : "var(--color-text-muted)",
                    }}
                  >
                    Нагрузка: {v.total_load.toFixed(1)}
                  </span>
                )}
              </div>

              {v?.messages.map((m, midx: number) => (
                <div key={midx} className="text-sm mb-1" style={{ color: m.level === "error" ? "#ef4444" : "#eab308" }}>
                  {m.level === "error" ? "❌" : "⚠️"} {m.message}
                </div>
              ))}

              <div
                className="grid gap-3 min-h-[60px] p-3 rounded-xl"
                style={{ backgroundColor: "var(--color-bg-main)", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
              >
                {sem.course_ids.map((cid: string) => {
                  const c = courses.find((item) => item.id === cid);
                  return (
                    <div
                      key={cid}
                      className="rounded-xl p-3 flex justify-between items-center"
                      style={{ backgroundColor: "var(--color-bg-main)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--color-border)" }}
                    >
                      <strong className="font-semibold text-sm" style={{ color: "var(--color-text-main)" }}>
                        {c?.title || cid}
                      </strong>
                      <button onClick={() => removeCourse(idx, cid)} className="border-none cursor-pointer p-0" style={{ color: "#ef4444" }}>
                        <Trash size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <select
                className="mt-2 w-full p-1 text-sm rounded-lg"
                style={{ backgroundColor: "var(--color-bg-main)", color: "var(--color-text-main)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--color-border)" }}
                onChange={(e) => { addCourse(idx, e.target.value); e.target.value = ""; }}
              >
                <option value="">+ Добавить курс</option>
                {courses.filter((c) => !roadmap.some((s) => s.course_ids.includes(c.id))).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}