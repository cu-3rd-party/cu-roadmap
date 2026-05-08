import React from "react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header
      className="h-16 border-b flex items-center justify-between px-6 z-40"
      style={{
        backgroundColor: "var(--color-bg-main)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2.5 font-extrabold text-xs max-w-45 leading-tight">
          <svg viewBox="0 0 40 40" width="24" height="24" fill="currentColor">
            <path d="M20 5L35 12.5V27.5L20 35L5 27.5V12.5L20 5Z" />
          </svg>
          <div
            className="tracking-wide"
            style={{ color: "var(--color-text-main)" }}
          >
            ROADMAP ENGINE
          </div>
        </div>
        <nav className="hidden md:flex gap-1">
          <button
            className={`bg-transparent border-none text-sm cursor-pointer px-3 py-1.5 rounded-md font-medium`}
            style={{
              color:
                activeTab === "wizard"
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
            }}
            onClick={() => setActiveTab("wizard")}
          >
            Движок
          </button>
          <button
            className={`bg-transparent border-none text-sm cursor-pointer px-3 py-1.5 rounded-md font-medium`}
            style={{ color: "var(--color-text-muted)" }}
          >
            More Soon...
          </button>
        </nav>
      </div>
      {/*<div className="flex items-center gap-4">*/}
      {/*  <div>*/}
      {/*    <span className="text-gray-500 text-sm mr-3">Тестовый Студент</span>*/}
      {/*  </div>*/}
      {/*  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-600">*/}
      {/*    ТС*/}
      {/*  </div>*/}
      {/*</div>*/}
    </header>
  );
}
