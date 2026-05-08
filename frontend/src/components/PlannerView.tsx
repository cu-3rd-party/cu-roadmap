import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../consts";

interface PlannerViewProps {
  passedIds: string[];
  setPassedIds: React.Dispatch<React.SetStateAction<string[]>>;
  triggerGenerate: number;
  setData: React.Dispatch<React.SetStateAction<RoadmapData | null>>;
  data: RoadmapData | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

interface Course {
  id: string;
  title: string;
}

interface Major {
  id: string;
  title: string;
}

interface RoadmapSemester {
  semester: number;
  total_load?: number;
  error?: string;
  courses: { id: string; title: string; type: string; workload: number }[];
}

export interface RoadmapData {
  roadmap: RoadmapSemester[];
}

export function PlannerView({
  passedIds,
  setPassedIds,
  triggerGenerate,
  setData,
  data,
  setLoading,
  loading,
}: PlannerViewProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then((res) => setCourses(res.data));
    axios.get(`${API_BASE}/majors/`).then((res) => {
      setMajors(res.data);
      if (res.data.length > 0) setSelectedMajor(res.data[0].id);
    });
  }, []);

  const generatePlan = useCallback(() => {
    if (!selectedMajor) return;
    setLoading(true);
    axios
      .post(`${API_BASE}/planner/generate/`, {
        passed_course_ids: passedIds,
        major_id: selectedMajor,
        current_semester: startSem,
        max_load: 12.0,
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedMajor, passedIds, startSem, setData, setLoading]);

  useEffect(() => {
    if (triggerGenerate > 0) generatePlan();
  }, [triggerGenerate, generatePlan]);

  const fixPrereq = (courseTitle: string) => {
    const target = courses.find((c) => courseTitle.includes(c.title));
    if (target && !passedIds.includes(target.id)) {
      setPassedIds((prev: string[]) => [...prev, target.id]);
      setTimeout(generatePlan, 100);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className="text-xs uppercase font-semibold tracking-wide mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        Траектория &gt; Планировщик
      </div>
      <h1
        className="text-3xl font-extrabold mb-8 tracking-tight"
        style={{ color: "var(--color-text-main)" }}
      >
        Построение траектории
      </h1>
      <p className="mb-5" style={{ color: "var(--color-text-muted)" }}>
        Укажите мейджор и семестр, с которого вы хотите начать планирование.
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
            Целевое направление (Major)
          </label>
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="w-full p-2.5 border rounded-lg text-base"
            style={{
              backgroundColor: "var(--color-bg-main)",
              color: "var(--color-text-main)",
              borderColor: "var(--color-border)",
            }}
          >
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-44">
          <label
            className="text-xs font-bold uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Текущий семестр
          </label>
          <input
            type="number"
            value={startSem}
            onChange={(e) => setStartSem(parseInt(e.target.value))}
            min={1}
            max={8}
            className="w-full p-2.5 border rounded-lg text-base"
            style={{
              backgroundColor: "var(--color-bg-main)",
              color: "var(--color-text-main)",
              borderColor: "var(--color-border)",
            }}
          />
        </div>
        <button
          className="text-white border-none px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer h-10"
          style={{ backgroundColor: "var(--color-primary)" }}
          onClick={generatePlan}
          disabled={loading}
        >
          {loading ? "Строим..." : "Рассчитать"}
        </button>
      </div>

      {data?.roadmap && (
        <div className="flex flex-col gap-8 mt-10">
          <div className="flex flex-col gap-8">
            {data.roadmap.map((sem, idx: number) => (
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
                  <span
                    className="text-xs px-2 py-1 rounded font-semibold"
                    style={{
                      backgroundColor: "var(--color-bg-main)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Нагрузка: {(sem.total_load || 0).toFixed(1)} / 12.0
                  </span>
                </div>
                {sem.error && typeof sem.error === "string" && (
                  <div className="text-sm mt-2" style={{ color: "#ef4444" }}>
                    <span>⚠️ {sem.error}</span>
                    {(sem.error.includes("пререквизиты") ||
                      sem.error.includes("prereqs")) && (
                      <button
                        className="text-white border-none px-2 py-1 rounded text-xs font-bold cursor-pointer ml-2"
                        style={{ backgroundColor: "#ef4444" }}
                        onClick={() => sem.error && fixPrereq(sem.error)}
                      >
                        ИСПРАВИТЬ
                      </button>
                    )}
                  </div>
                )}
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                  }}
                >
                  {sem.courses.map((c) => (
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
                      <div className="flex gap-2 mt-1">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-bold"
                          style={{
                            backgroundColor: "var(--color-bg-hover)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {c.type}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {c.workload} к.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}