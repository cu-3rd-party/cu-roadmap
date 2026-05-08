import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../consts";

export function GoalPlannerView({ passedIds }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [targetId, setTargetId] = useState("");
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then((res) => setCourses(res.data));
  }, []);

  const generatePath = () => {
    if (!targetId) return;
    setLoading(true);
    axios
      .post(`${API_BASE}/planner/goal-path/`, {
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
      <h1 className="text-3xl font-extrabold text-gray-900">
        Планирование от цели
      </h1>
      <p className="text-gray-500 mb-6">
        Выберите курс, который вы хотите пройти в будущем, и система построит
        кратчайший путь до него.
      </p>

      <div className="flex gap-6 items-end pb-6 border-b border-gray-200">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase">
            Целевой курс
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full p-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-base"
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
          className="bg-primary text-white border-none px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer h-10"
          onClick={generatePath}
          disabled={loading || !targetId}
        >
          {loading ? "Строим..." : "Построить путь"}
        </button>
      </div>

      {roadmap.length > 0 && (
        <div className="flex flex-col gap-8 mt-10">
          <div className="flex flex-col gap-8">
            {roadmap.map((sem: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 min-h-[200px]"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Семестр {sem.semester}</h3>
                  {sem.total_load && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold">
                      Нагрузка: {sem.total_load.toFixed(1)}
                    </span>
                  )}
                </div>
                {sem.error && (
                  <div className="text-red-500 text-sm mb-2">
                    ⚠️ {sem.error}
                  </div>
                )}
                {sem.status && (
                  <div className="text-sm text-gray-500 mb-2">{sem.status}</div>
                )}
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                  }}
                >
                  {(sem.courses || []).map((c: any) => (
                    <div
                      key={c.id}
                      className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
                    >
                      <strong className="font-semibold">{c.title}</strong>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.workload} к.
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
