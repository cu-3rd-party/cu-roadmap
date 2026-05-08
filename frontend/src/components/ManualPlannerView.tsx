import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../consts";
import { Trash } from "lucide-react";

export function ManualPlannerView({ passedIds, roadmap, setRoadmap }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [validation, setValidation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then((res) => setCourses(res.data));
  }, []);

  const validate = () => {
    setLoading(true);
    axios
      .post(`${API_BASE}/planner/validate-roadmap/`, {
        passed_course_ids: passedIds,
        roadmap: roadmap,
        max_load: 12.0,
      })
      .then((res) => {
        setValidation(res.data.validation_results);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const addCourse = (semIdx: number, courseId: string) => {
    if (!courseId) return;
    const newRoadmap = [...roadmap];
    if (!newRoadmap[semIdx].course_ids.includes(courseId)) {
      newRoadmap[semIdx].course_ids = [
        ...newRoadmap[semIdx].course_ids,
        courseId,
      ];
      setRoadmap(newRoadmap);
    }
  };

  const removeCourse = (semIdx: number, courseId: string) => {
    const newRoadmap = [...roadmap];
    newRoadmap[semIdx].course_ids = newRoadmap[semIdx].course_ids.filter(
      (id: string) => id !== courseId,
    );
    setRoadmap(newRoadmap);
  };

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-3xl font-extrabold text-gray-900">
        Песочница (Ручное планирование)
      </h1>
      <p className="text-gray-500 mb-6">
        Расставьте курсы по семестрам самостоятельно и проверьте план на
        корректность.
      </p>

      <div className="mb-6">
        <button
          className="bg-primary text-white border-none px-4 py-2 rounded-lg font-bold text-sm cursor-pointer"
          onClick={validate}
          disabled={loading}
        >
          {loading ? "Проверяем..." : "Проверить план"}
        </button>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-8">
          {roadmap.map((sem: any, idx: number) => {
            const v = validation.find((res) => res.semester === sem.semester);
            return (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
                style={{ border: v && !v.valid ? "2px solid #fee2e2" : "" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Семестр {sem.semester}</h3>
                  {v && (
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${v.total_load > 12 ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"}`}
                    >
                      Нагрузка: {v.total_load.toFixed(1)}
                    </span>
                  )}
                </div>

                {v &&
                  v.messages.map((m: any, midx: number) => (
                    <div
                      key={midx}
                      className={`text-sm mb-1 ${m.level === "error" ? "text-red-500" : "text-yellow-600"}`}
                    >
                      {m.level === "error" ? "❌" : "⚠️"} {m.message}
                    </div>
                  ))}

                <div
                  className="grid gap-3 min-h-[60px] bg-gray-100 p-3 rounded-xl"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                  }}
                >
                  {sem.course_ids.map((cid: string) => {
                    const c = courses.find((item) => item.id === cid);
                    return (
                      <div
                        key={cid}
                        className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center"
                      >
                        <strong className="font-semibold text-sm">
                          {c?.title || cid}
                        </strong>
                        <button
                          onClick={() => removeCourse(idx, cid)}
                          className="bg-transparent border-none text-red-500 cursor-pointer p-0"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <select
                  className="mt-2 w-full p-1 text-sm bg-white text-gray-900 border border-gray-200 rounded-lg"
                  onChange={(e) => {
                    addCourse(idx, e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">+ Добавить курс</option>
                  {courses
                    .filter(
                      (c) =>
                        !roadmap.some((s: any) => s.course_ids.includes(c.id)),
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
