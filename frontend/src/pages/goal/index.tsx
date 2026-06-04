import React, { useEffect, useState } from "react";

import { api, type Course } from "@/shared/config";

interface GoalPageProps {
  passedIds: string[];
}

interface RoadmapSemester {
  semester: number;
  total_load?: number;
  error?: string;
  status?: string;
  courses?: Course[];
}

export function GoalPage({ passedIds }: GoalPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [targetId, setTargetId] = useState("");
  const [roadmap, setRoadmap] = useState<RoadmapSemester[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCourses().then((res) => setCourses(res.data));
  }, []);

  const generatePath = () => {
    if (!targetId) return;
    setLoading(true);
    api
      .generateGoalPath({
        target_course_id: targetId,
        passed_course_ids: passedIds,
        current_semester: 1,
        max_load: 12.0,
      })
      .then((res) => {
        setRoadmap(res.data.roadmap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="flex flex-col w-full">
      <h1
        className="text-3xl font-extrabold"
        style={{ color: "var(--color-text-main)" }}
      >
        Планирование от цели
      </h1>
      <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
        Выберите курс, который вы хотите пройти в будущем, и система построит
        кратчайший путь до него.
      </p>

      <div
        className="flex gap-6 items-end pb-6"
        style={{ borderColor: "var(--color-border)", borderBottomWidth: 1 }}
      >
        <div className="flex flex-col gap-2 flex-1">
          <label
            className="text-xs font-bold uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Целевой курс
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full p-2.5 border rounded-lg text-base"
            style={{
              backgroundColor: "var(--color-bg-main)",
              color: "var(--color-text-main)",
              borderColor: "var(--color-border)",
            }}
          >
            <option value="">Выберите курс...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <button
          className="text-white border-none px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer h-10"
          style={{ backgroundColor: "var(--color-primary)" }}
          onClick={generatePath}
          disabled={loading || !targetId}
        >
          {loading ? "Строим..." : "Построить путь"}
        </button>
      </div>

      {roadmap.length > 0 && (
        <div className="flex flex-col gap-8 mt-10">
          {roadmap.map((sem, idx: number) => (
            <div
              key={idx}
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
                  Семестр {sem.semester}
                </h3>
                {sem.total_load && (
                  <span
                    className="text-xs px-2 py-1 rounded font-semibold"
                    style={{
                      backgroundColor: "var(--color-bg-main)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Нагрузка: {sem.total_load.toFixed(1)}
                  </span>
                )}
              </div>
              {sem.error && (
                <div className="text-sm mb-2" style={{ color: "#ef4444" }}>
                  ⚠️ {sem.error}
                </div>
              )}
              {sem.status && (
                <div
                  className="text-sm mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {sem.status}
                </div>
              )}
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                }}
              >
                {(sem.courses || []).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl p-3 shadow-sm"
                    style={{
                      backgroundColor: "var(--color-bg-main)",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <strong
                      className="font-semibold"
                      style={{ color: "var(--color-text-main)" }}
                    >
                      {c.title}
                    </strong>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {c.workload} к.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
