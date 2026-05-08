import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../consts";
import {
  Search,
  Check,
  ChevronRight,
  BookOpen,
  Settings,
  Route,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface StepWizardProps {
  passedIds: string[];
  setPassedIds: any;
  roadmapData: any;
  setRoadmapData: any;
  loading: boolean;
  setLoading: any;
}

const steps = [
  { id: 1, title: "Курсы", desc: "Что вы уже изучали", icon: BookOpen },
  {
    id: 2,
    title: "Настройка",
    desc: "Специальность и семестр",
    icon: Settings,
  },
  { id: 3, title: "Траектория", desc: "Ваш план обучения", icon: Route },
];

export function StepWizard({
  passedIds,
  setPassedIds,
  roadmapData,
  setRoadmapData,
  loading,
  setLoading,
}: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then((res) => setCourses(res.data));
    axios.get(`${API_BASE}/majors/`).then((res) => {
      setMajors(res.data);
      if (res.data.length > 0) setSelectedMajor(res.data[0].id);
    });
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("stem")) return "#4B9B9B";
    if (cat.includes("business")) return "#FF7E3D";
    if (cat.includes("tech")) return "#00A3FF";
    if (cat.includes("soft")) return "#C0EB00";
    return "#8B5CF6";
  };

  const generatePlan = () => {
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
        setRoadmapData(res.data);
        setLoading(false);
        setCurrentStep(3);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fixPrereq = (courseTitle: string) => {
    const target = courses.find((c) => courseTitle.includes(c.title));
    if (target && !passedIds.includes(target.id)) {
      setPassedIds((prev: string[]) => [...prev, target.id]);
      setTimeout(generatePlan, 100);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, idx) => {
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? "bg-white/20" : isActive ? "bg-white/20" : "bg-gray-200"}`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{step.title}</span>
                  <span
                    className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"}`}
                  >
                    {step.desc}
                  </span>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight
                  size={20}
                  className={`${isActive ? "text-primary" : "text-gray-300"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentStep === 1 && (
          <div className="flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                Какие курсы вы уже прошли?
              </h2>
              <p className="text-gray-500">
                Отметьте курсы, которые вы изучали или планируете изучать
              </p>
            </div>

            <div className="relative max-w-md mx-auto mb-6">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base"
              />
            </div>

            <div className="flex items-center gap-3 mb-4 px-4">
              <Check size={16} className="text-primary" />
              <span className="text-sm font-medium text-gray-600">
                Выбрано курсов: <strong>{passedIds.length}</strong>
              </span>
            </div>

            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              }}
            >
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:shadow-md ${passedIds.includes(c.id) ? "border-primary shadow-sm" : "border-gray-100 hover:border-gray-300"}`}
                  onClick={() => toggleCourse(c.id)}
                >
                  <div
                    className="h-24 relative"
                    style={{ backgroundColor: getCategoryColor(c.category) }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 200 80"
                      opacity="0.3"
                    >
                      <path
                        d="M20 40 Q100 10 180 40"
                        stroke="white"
                        fill="none"
                        strokeWidth="1"
                      />
                    </svg>
                    {passedIds.includes(c.id) && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                        <Check size={14} className="text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-sm mb-1 text-gray-900">
                      {c.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.category} • {c.workload} к.
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={passedIds.length === 0}
                className="flex items-center gap-2 bg-primary text-white border-none px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Далее <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Настройка траектории</h2>
              <p className="text-gray-500">
                Выберите направление и укажите, когда вы поступили
              </p>
            </div>

            <div className="max-w-xl mx-auto bg-gray-50 rounded-2xl p-6">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Целевое направление (Major)
                  </label>
                  <select
                    value={selectedMajor}
                    onChange={(e) => setSelectedMajor(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-base"
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Семестр начала обучения
                  </label>
                  <div className="flex gap-2">
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                      <button
                        key={sem}
                        onClick={() => setStartSem(sem)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${startSem === sem ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        Семестр {sem}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Укажите семестр, с которого хотите начать планирование
                    траектории
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles
                    size={20}
                    className="text-primary mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="font-bold text-sm text-gray-900">
                      AI сгенерирует оптимальный план
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Система учтёт все пререквизиты и равномерно распределит
                      нагрузку
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6 max-w-xl mx-auto">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={18} /> Назад
              </button>
              <button
                onClick={generatePlan}
                disabled={loading || !selectedMajor}
                className="flex items-center gap-2 bg-primary text-white border-none px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                {loading ? "Генерируем..." : "Построить траекторию"}{" "}
                <Sparkles size={18} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && roadmapData && roadmapData.roadmap && (
          <div className="flex flex-col">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-3">
                <Check size={16} /> Траектория построена
              </div>
              <h2 className="text-2xl font-bold">Ваш план обучения</h2>
              <p className="text-gray-500 mt-1">
                Рекомендуемая последовательность курсов по семестрам
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {roadmapData.roadmap.map((sem: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-5"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
                        {sem.semester}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          Семестр {sem.semester}
                        </h3>
                        <span className="text-xs text-gray-500">
                          Осень/Весна 20
                          {24 + Math.floor((sem.semester - 1) / 2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-bold px-3 py-1 rounded-lg ${(sem.total_load || 0) <= 12 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {(sem.total_load || 0).toFixed(1)} / 12 кредитов
                      </div>
                    </div>
                  </div>
                  {sem.error && typeof sem.error === "string" && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                      <span>⚠️ {sem.error}</span>
                      {(sem.error.includes("пререквизиты") ||
                        sem.error.includes("prereqs")) && (
                        <button
                          className="bg-red-500 text-white border-none px-2 py-1 rounded font-bold text-xs cursor-pointer ml-auto"
                          onClick={() => fixPrereq(sem.error)}
                        >
                          Исправить
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                    }}
                  >
                    {sem.courses.map((c: any) => (
                      <div
                        key={c.id}
                        className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
                      >
                        <div className="font-semibold text-sm mb-1">
                          {c.title}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                            {c.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {c.workload} к.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 gap-4">
              <button
                onClick={() => {
                  setRoadmapData(null);
                  setCurrentStep(1);
                }}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Начать заново
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 bg-primary text-white border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-blue-600 transition-colors"
              >
                Изменить настройки
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
