interface SemesterSectionProps {
  semester: any;
  courseGrid?: boolean;
  onRemoveCourse?: (courseId: string, semIdx: number) => void;
  semIdx?: number;
  fixPrereq?: (courseTitle: string) => void;
  validation?: any;
}

export function SemesterSection({
  semester,
  onRemoveCourse,
  semIdx,
  fixPrereq,
  validation,
}: SemesterSectionProps) {
  const load = semester.total_load || 0;
  const isOverloaded = load > 12;

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-2xl p-6 min-h-[200px] ${
        validation && !validation.valid ? "border-2 border-red-200" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Семестр {semester.semester}</h3>
        {(load > 0 || validation) && (
          <span
            className={`text-xs px-2 py-1 rounded font-semibold ${
              isOverloaded ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
            }`}
          >
            Нагрузка: {load.toFixed(1)} / 12.0
          </span>
        )}
      </div>

      {semester.error && typeof semester.error === "string" && (
        <div className="text-red-500 text-sm mb-2">
          <span>⚠️ {semester.error}</span>
          {(semester.error.includes("пререквизиты") ||
            semester.error.includes("prereqs")) && (
            <button
              className="bg-red-500 text-white border-none px-2 py-1 rounded text-xs font-bold cursor-pointer ml-2"
              onClick={() => fixPrereq?.(semester.error)}
            >
              ИСПРАВИТЬ
            </button>
          )}
        </div>
      )}

      {validation?.messages.map((m: any, midx: number) => (
        <div
          key={midx}
          className={`text-sm mb-1 ${m.level === "error" ? "text-red-500" : "text-yellow-600"}`}
        >
          {m.level === "error" ? "❌" : "⚠️"} {m.message}
        </div>
      ))}

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {(semester.courses || semester.course_ids || []).map((c: any) => {
          const isString = typeof c === "string";
          return (
            <div
              key={isString ? c : c.id}
              className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex justify-between items-center"
            >
              <div>
                <strong className="font-semibold">{isString ? c : c.title}</strong>
                {!isString && c.type && (
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                      {c.type}
                    </span>
                    <span className="text-xs text-gray-500">{c.workload} к.</span>
                  </div>
                )}
                {!isString && !c.type && (
                  <div className="text-xs text-gray-500 mt-1">{c.workload} к.</div>
                )}
              </div>
              {onRemoveCourse && semIdx !== undefined && (
                <button
                  onClick={() => onRemoveCourse(isString ? c : c.id, semIdx)}
                  className="bg-transparent border-none text-red-500 cursor-pointer p-0 ml-2"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
