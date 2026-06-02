import React, { useEffect, useState, useCallback } from "react";
import { api, type RoadmapData, type Course } from "@/shared/config";
import { SemesterCard } from "@/widgets/SemesterCard";

interface PlannerPageProps {
  passedIds: string[];
  setPassedIds: React.Dispatch<React.SetStateAction<string[]>>;
  roadmapCourseIds: string[];
  triggerGenerate: number;
  setData: React.Dispatch<React.SetStateAction<RoadmapData | null>>;
  data: RoadmapData | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

type PlannerCourseSource = "passed" | "selected";

interface Major {
  id: string;
  title: string;
}

export function PlannerPage({
  passedIds,
  setPassedIds,
  roadmapCourseIds,
  triggerGenerate,
  setData,
  data,
  setLoading,
  loading,
}: PlannerPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);
  const [courseSource, setCourseSource] =
    useState<PlannerCourseSource>("passed");

  useEffect(() => {
    api.getCourses().then((res) => setCourses(res.data));
    api.getMajors().then((res) => {
      setMajors(res.data);
      if (res.data.length > 0) setSelectedMajor(res.data[0].id);
    });
  }, []);

  const generatePlan = useCallback(() => {
    if (!selectedMajor) return;
    setLoading(true);
    api
      .generateRoadmap({
        passed_course_ids: passedIds,
        selected_course_ids: roadmapCourseIds,
        course_source: courseSource,
        major_id: selectedMajor,
        current_semester: startSem,
        max_load: 12.0,
      })
      .then((res) => {
        setData({
          ...res.data,
          roadmap: res.data.roadmap.map((semester) => ({
            ...semester,
            courses:
              semester.courses?.length > 0
                ? semester.courses
                : (semester.course_ids || [])
                    .map((id) => courses.find((course) => course.id === id))
                    .filter((course): course is Course => Boolean(course)),
          })),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [
    selectedMajor,
    passedIds,
    roadmapCourseIds,
    courseSource,
    startSem,
    setData,
    setLoading,
    courses,
  ]);

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
        <div className="flex flex-col gap-2 w-72">
          <label
            className="text-xs font-bold uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Учитывать курсы
          </label>
          <select
            value={courseSource}
            onChange={(e) =>
              setCourseSource(e.target.value as PlannerCourseSource)
            }
            className="w-full p-2.5 border rounded-lg text-base"
            style={{
              backgroundColor: "var(--color-bg-main)",
              color: "var(--color-text-main)",
              borderColor: "var(--color-border)",
            }}
          >
            <option value="passed">Только реально пройденные</option>
            <option value="selected">Все курсы из траектории</option>
          </select>
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
          <div className="flex items-center gap-3">
            <div
              className="h-px flex-1 bg-border"
              style={{ backgroundColor: "var(--color-border)" }}
            ></div>
            <div
              className="px-4 py-1.5 rounded-full text-sm font-bold border"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              План для:{" "}
              {majors.find((m) => m.id === selectedMajor)?.title ||
                selectedMajor}
            </div>
            <div
              className="h-px flex-1 bg-border"
              style={{ backgroundColor: "var(--color-border)" }}
            ></div>
          </div>
          {data.roadmap.map((sem, idx: number) => (
            <SemesterCard
              key={idx}
              semester={sem}
              fixPrereq={fixPrereq}
              allCourses={courses}
              passedIds={passedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
