import React from "react";
import { X, Lock, Unlock, ArrowRight, Info, AlertTriangle } from "lucide-react";
import type { Course } from "../config/types";
import { getCategoryColor } from "../lib";

interface CourseInfoModalProps {
  course: Course;
  allCourses: Course[];
  onClose: () => void;
  onToggleSemester?: (semester: number) => void;
  currentSemester?: number;
  mandatoryCourseIds?: string[];
  passedIds?: string[];
}

export function CourseInfoModal({
  course,
  allCourses,
  onClose,
  onToggleSemester,
  currentSemester,
  mandatoryCourseIds = [],
  passedIds = [],
}: CourseInfoModalProps) {
  const isMandatory = mandatoryCourseIds.includes(course.id);
  const prerequisites = allCourses.filter((c) =>
    course.prerequisites?.includes(c.id),
  );
  const postrequisites = allCourses.filter((c) =>
    c.prerequisites?.includes(course.id),
  );

  const missingPrereqs = prerequisites.filter((p) => !passedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: "#141414",
          borderColor: "rgba(255,255,255,0.1)",
          color: "#E6E6E6",
        }}
      >
        {/* Header */}
        <div className="p-6 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: getCategoryColor(course.category) }}
          >
            {course.category}
          </div>
          <h2 className="text-3xl font-black tracking-tight">{course.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">
          {/* Status Badge */}
          {isMandatory && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20"
              style={{ color: "#009B40" }}
            >
              <Info size={16} />
              <span className="text-sm font-semibold">
                Обязательный для твоего мейджора
              </span>
            </div>
          )}

          {/* Warning */}
          {missingPrereqs.length > 0 && (
            <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div
                className="flex items-center gap-2"
                style={{ color: "#E63F07" }}
              >
                <AlertTriangle size={16} />
                <span className="text-sm font-bold">
                  Не все пререквизиты выполнены
                </span>
              </div>
              <div className="text-xs opacity-70">
                Нужно пройти: {missingPrereqs.map((p) => p.title).join(", ")}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
              Описание
            </div>
            <p className="text-sm leading-relaxed opacity-80">
              {course.description || "Нет описания для этого курса."}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">
                Рек. Семестр
              </div>
              <div className="text-xl font-bold">
                {course.recommended_semester || "—"}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">
                Нагрузка
              </div>
              <div className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                {course.workload} к.
              </div>
            </div>
          </div>

          {/* Majors - only show if we have data or in major context */}
          {isMandatory && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                Мейджоры
              </div>
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="opacity-50 mr-2">статус:</span>
                  <span className="font-semibold" style={{ color: "#00A3FF" }}>
                    Обязательный (Core)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dependencies */}
          <div className="space-y-4">
            {prerequisites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">
                  <ArrowRight size={12} /> Пререквизиты
                </div>
                <div className="space-y-2">
                  {prerequisites.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm"
                    >
                      {passedIds.includes(p.id) ? (
                        <Unlock size={14} className="text-green-500" />
                      ) : (
                        <Lock size={14} className="opacity-40" />
                      )}
                      {p.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {postrequisites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">
                  <Unlock size={12} /> Постреквизиты (открывает)
                </div>
                <div className="space-y-2">
                  {postrequisites.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm"
                    >
                      <ArrowRight size={14} className="text-cyan-400" />
                      {p.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chain */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">
              Цепочка зависимостей
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const chain: Course[] = [];
                let curr: Course | undefined = prerequisites[0];
                let safety = 0;
                while (curr && safety < 3) {
                  chain.unshift(curr);
                  curr = allCourses.find((c) =>
                    curr?.prerequisites?.includes(c.id),
                  );
                  safety++;
                }
                return (
                  <>
                    {chain.map((c) => (
                      <React.Fragment key={c.id}>
                        <div className="px-2 py-1 rounded bg-white/10 text-[10px] opacity-40">
                          {c.title}
                        </div>
                        <ArrowRight size={10} className="opacity-20" />
                      </React.Fragment>
                    ))}
                    <div
                      className="px-2 py-1 rounded text-[10px] font-bold"
                      style={{ backgroundColor: "#009B40", color: "white" }}
                    >
                      {course.title}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">
              {currentSemester ? "В текущем плане:" : "Добавить в семестр:"}
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => onToggleSemester?.(s)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                    s === currentSemester
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  C{s}
                  {s === currentSemester && (
                    <span className="ml-0.5 text-[8px]">★</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
