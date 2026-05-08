import React, { useState } from "react";
import {
  Book,
  Calculator,
  Calendar,
  Moon,
  Network as NetworkIcon,
  Search,
  Sun,
  Target,
  Wand2,
} from "lucide-react";
import { useTheme } from "@/app/providers";
import { SidebarButton } from "@/shared/ui";
import { WizardPage } from "@/pages/wizard";
import { CoursesPage } from "@/pages/courses";
import { PlannerPage } from "@/pages/planner";
import { GoalPage } from "@/pages/goal";
import { CalculatorPage } from "@/pages/calculator";
import { ManualPage } from "@/pages/manual";
import { GraphPage } from "@/pages/graph";
import { MajorsPage } from "@/pages/majors";
import type { RoadmapData } from "@/shared/config";

export default function App() {
  const [activeTab, setActiveTab] = useState("wizard");
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [manualRoadmap, setManualRoadmap] = useState<{ semester: number; course_ids: string[] }[]>([
    { semester: 1, course_ids: [] },
    { semester: 2, course_ids: [] },
    { semester: 3, course_ids: [] },
    { semester: 4, course_ids: [] },
  ]);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [triggerGenerate, setTriggerGenerate] = useState(0);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-screen">
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
            <div className="tracking-wide" style={{ color: "var(--color-text-main)" }}>
              ROADMAP ENGINE
            </div>
          </div>
          <nav className="hidden md:flex gap-1">
            <button
              className="bg-transparent border-none text-sm cursor-pointer px-3 py-1.5 rounded-md font-medium"
              style={{
                color: activeTab === "wizard" ? "var(--color-primary)" : "var(--color-text-muted)",
              }}
              onClick={() => setActiveTab("wizard")}
            >
              Движок
            </button>
            <button className="bg-transparent border-none text-sm cursor-pointer px-3 py-1.5 rounded-md font-medium" style={{ color: "var(--color-text-muted)" }}>
              More Soon...
            </button>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 w-full overflow-hidden">
        <aside
          className="hidden md:flex w-16 min-w-16 border-r flex-col items-center pt-5 pb-5 gap-4"
          style={{
            backgroundColor: "var(--color-bg-sidebar)",
            borderColor: "var(--color-border)",
          }}
        >
          <SidebarButton icon={Wand2} active={activeTab === "wizard"} onClick={() => setActiveTab("wizard")} title="Wizard" />
          <SidebarButton icon={Book} active={activeTab === "courses"} onClick={() => setActiveTab("courses")} title="Courses" />
          <SidebarButton icon={Calendar} active={activeTab === "planner"} onClick={() => setActiveTab("planner")} title="Planner" />
          <SidebarButton icon={NetworkIcon} active={activeTab === "graph"} onClick={() => setActiveTab("graph")} title="Graph" />
          <SidebarButton icon={Calculator} active={activeTab === "calculator"} onClick={() => setActiveTab("calculator")} title="Identifier" />
          <SidebarButton icon={Target} active={activeTab === "goal"} onClick={() => setActiveTab("goal")} title="Goal" />
          <SidebarButton icon={Search} active={activeTab === "manual"} onClick={() => setActiveTab("manual")} title="Manual" />
          <div className="flex-1" />
          <SidebarButton icon={theme === "dark" ? Sun : Moon} active={false} onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"} />
        </aside>

        <aside
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex flex-row items-center gap-2 px-4 z-40"
          style={{
            backgroundColor: "var(--color-bg-sidebar)",
            borderColor: "var(--color-border)",
          }}
        >
          <SidebarButton icon={Wand2} active={activeTab === "wizard"} onClick={() => setActiveTab("wizard")} title="Wizard" />
          <SidebarButton icon={Book} active={activeTab === "courses"} onClick={() => setActiveTab("courses")} title="Courses" />
          <SidebarButton icon={Calendar} active={activeTab === "planner"} onClick={() => setActiveTab("planner")} title="Planner" />
          <SidebarButton icon={NetworkIcon} active={activeTab === "graph"} onClick={() => setActiveTab("graph")} title="Graph" />
          <SidebarButton icon={Calculator} active={activeTab === "calculator"} onClick={() => setActiveTab("calculator")} title="Identifier" />
          <SidebarButton icon={Target} active={activeTab === "goal"} onClick={() => setActiveTab("goal")} title="Goal" />
          <SidebarButton icon={Search} active={activeTab === "manual"} onClick={() => setActiveTab("manual")} title="Manual" />
          <div className="flex-1" />
          <SidebarButton icon={theme === "dark" ? Sun : Moon} active={false} onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"} />
        </aside>

        <main
          className="flex-1 w-full overflow-y-auto p-10 flex flex-col"
          style={{
            backgroundColor: "var(--color-bg-main)",
            color: "var(--color-text-main)",
          }}
        >
          {activeTab === "wizard" && (
            <WizardPage
              passedIds={passedIds}
              setPassedIds={setPassedIds}
              roadmapData={roadmapData}
              setRoadmapData={setRoadmapData}
              loading={plannerLoading}
              setLoading={setPlannerLoading}
            />
          )}
          {activeTab === "courses" && (
            <CoursesPage passedIds={passedIds} setPassedIds={setPassedIds} />
          )}
          {activeTab === "planner" && (
            <PlannerPage
              passedIds={passedIds}
              setPassedIds={setPassedIds}
              triggerGenerate={triggerGenerate}
              setData={setRoadmapData}
              data={roadmapData}
              setLoading={setPlannerLoading}
              loading={plannerLoading}
            />
          )}
          {activeTab === "calculator" && (
            <CalculatorPage passedIds={passedIds} />
          )}
          {activeTab === "goal" && <GoalPage passedIds={passedIds} />}
          {activeTab === "manual" && (
            <ManualPage passedIds={passedIds} roadmap={manualRoadmap} setRoadmap={setManualRoadmap} />
          )}
          {activeTab === "graph" && <GraphPage />}
          {activeTab === "majors" && <MajorsPage />}
        </main>
      </div>

      {/*<StickyTracker count={passedIds.length} activeTab={activeTab} onGenerate={() => setTriggerGenerate((v) => v + 1)} />*/}
    </div>
  );
}

function StickyTracker({ count, activeTab, onGenerate }: { count: number; activeTab: string; onGenerate: () => void }) {
  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border"
      style={{
        backgroundColor: "var(--color-bg-main)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: "var(--color-text-main)" }}>
          {count} курсов выбрано
        </span>
      </div>
      {activeTab !== "wizard" && (
        <button
          className="text-white border-none px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
          style={{ backgroundColor: "var(--color-primary)" }}
          onClick={onGenerate}
        >
          Сгенерировать
        </button>
      )}
    </div>
  );
}