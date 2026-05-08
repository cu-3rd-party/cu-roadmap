import React from "react";

export function Header({ activeTab, setActiveTab }: any) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2.5 font-extrabold text-xs max-w-[180px] leading-tight">
          <svg viewBox="0 0 40 40" width="24" height="24" fill="#111">
            <path d="M20 5L35 12.5V27.5L20 35L5 27.5V12.5L20 5Z" />
          </svg>
          <div className="tracking-wide">ROADMAP ENGINE</div>
        </div>
        <nav className="hidden md:flex gap-1">
          <button
            className={`bg-transparent border-none text-sm text-gray-600 cursor-pointer px-3 py-1.5 rounded-md font-medium ${activeTab === "planner" ? "bg-blue-100/80 text-primary" : ""}`}
            onClick={() => setActiveTab("planner")}
          >
            Планировщик
          </button>
          <button
            className={`bg-transparent border-none text-sm text-gray-600 cursor-pointer px-3 py-1.5 rounded-md font-medium ${activeTab === "graph" ? "bg-blue-100/80 text-primary" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            Карта курсов
          </button>
          <button
            className={`bg-transparent border-none text-sm text-gray-600 cursor-pointer px-3 py-1.5 rounded-md font-medium ${activeTab === "courses" ? "bg-blue-100/80 text-primary" : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            Каталог
          </button>
          <button
            className={`bg-transparent border-none text-sm text-gray-600 cursor-pointer px-3 py-1.5 rounded-md font-medium ${activeTab === "calculator" ? "bg-blue-100/80 text-primary" : ""}`}
            onClick={() => setActiveTab("calculator")}
          >
            Подбор мейджора
          </button>
          <button
            className={`bg-transparent border-none text-sm text-gray-600 cursor-pointer px-3 py-1.5 rounded-md font-medium ${activeTab === "goal" ? "bg-blue-100/80 text-primary" : ""}`}
            onClick={() => setActiveTab("goal")}
          >
            Цель
          </button>
          <button
            className={`bg-transparent border-none text-sm text-gray-600 cursor-pointer px-3 py-1.5 rounded-md font-medium ${activeTab === "manual" ? "bg-blue-100/80 text-primary" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            Песочница
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <span className="text-gray-500 text-sm mr-3">Тестовый Студент</span>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-600">
          ТС
        </div>
      </div>
    </header>
  );
}
