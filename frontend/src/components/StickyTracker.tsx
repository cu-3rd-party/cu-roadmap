import React from "react";

interface StickyTrackerProps {
  count: number;
  activeTab: string;
  onGenerate: () => void;
}

export function StickyTracker({
  count,
  activeTab,
  onGenerate,
}: StickyTrackerProps) {
  if (
    activeTab !== "planner" &&
    activeTab !== "courses" &&
    activeTab !== "calculator" &&
    activeTab !== "goal" &&
    activeTab !== "manual"
  )
    return null;

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-50">
      <div
        className="rounded-xl flex items-center gap-5 shadow-lg border"
        style={{
          backgroundColor: "var(--color-bg-main)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-main)",
        }}
      >
        <div className="flex flex-col px-5 py-3">
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            ВЫБРАНО КУРСОВ
          </span>
          <span className="text-sm font-extrabold">{count}</span>
        </div>
        <div
          className="w-px h-6"
          style={{ backgroundColor: "var(--color-border)" }}
        />
        <div className="flex flex-col">
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            СТАТУС ПЛАНА
          </span>
          <span className="text-sm font-extrabold text-green-600">
            {count > 0 ? "ГОТОВ" : "ПУСТО"}
          </span>
        </div>
        {activeTab === "planner" && (
          <button
            className="border-none px-4 py-2 rounded-lg font-bold text-sm cursor-pointer ml-2 text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
            onClick={onGenerate}
          >
            ПОСТРОИТЬ ТРАЕКТОРИЮ
          </button>
        )}
      </div>
    </div>
  );
}
