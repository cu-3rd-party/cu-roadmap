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
import { Header } from "./components/Header";
import { StickyTracker } from "./components/StickyTracker";
import { GraphView } from "./components/GraphView";
import { MajorsView } from "./components/MajorsView";
import { CoursesView } from "./components/CoursesView";
import { PlannerView } from "./components/PlannerView";
import { MajorCalculatorView } from "./components/MajorCalculatorView";
import { GoalPlannerView } from "./components/GoalPlannerView";
import { ManualPlannerView } from "./components/ManualPlannerView";
import { StepWizard } from "./components/wizard/StepWizard";
import { SidebarButton } from "./components/ui";
import { useTheme } from "./context/ThemeContext";

interface RoadmapSemester {
  semester: number;
  course_ids: string[];
}

interface RoadmapData {
  roadmap: {
    semester: number;
    total_load?: number;
    error?: string;
    courses: { id: string; title: string; type: string; workload: number }[];
  }[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState("wizard");
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [manualRoadmap, setManualRoadmap] = useState<RoadmapSemester[]>([
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
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 w-full overflow-hidden">
        <aside className="hidden md:flex w-16 min-w-16 border-r flex-col items-center pt-5 pb-5 gap-4"
          style={{ backgroundColor: "var(--color-bg-sidebar)", borderColor: "var(--color-border)" }}>
          <SidebarButton
            icon={Wand2}
            active={activeTab === "wizard"}
            onClick={() => setActiveTab("wizard")}
            title="Wizard"
          />
          <SidebarButton
            icon={Book}
            active={activeTab === "courses"}
            onClick={() => setActiveTab("courses")}
            title="Courses"
          />
          <SidebarButton
            icon={Calendar}
            active={activeTab === "planner"}
            onClick={() => setActiveTab("planner")}
            title="Planner"
          />
          <SidebarButton
            icon={NetworkIcon}
            active={activeTab === "graph"}
            onClick={() => setActiveTab("graph")}
            title="Graph"
          />
          <SidebarButton
            icon={Calculator}
            active={activeTab === "calculator"}
            onClick={() => setActiveTab("calculator")}
            title="Identifier"
          />
          <SidebarButton
            icon={Target}
            active={activeTab === "goal"}
            onClick={() => setActiveTab("goal")}
            title="Goal"
          />
          <SidebarButton
            icon={Search}
            active={activeTab === "manual"}
            onClick={() => setActiveTab("manual")}
            title="Manual"
          />
          <div className="flex-1" />
          <SidebarButton
            icon={theme === "dark" ? Sun : Moon}
            active={false}
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          />
        </aside>
        <aside className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex flex-row items-center gap-2 px-4 z-40"
          style={{ backgroundColor: "var(--color-bg-sidebar)", borderColor: "var(--color-border)" }}>
          <SidebarButton
            icon={Book}
            active={activeTab === "courses"}
            onClick={() => setActiveTab("courses")}
            title="Courses"
          />
          <SidebarButton
            icon={Calendar}
            active={activeTab === "planner"}
            onClick={() => setActiveTab("planner")}
            title="Planner"
          />
          <SidebarButton
            icon={NetworkIcon}
            active={activeTab === "graph"}
            onClick={() => setActiveTab("graph")}
            title="Graph"
          />
          <SidebarButton
            icon={Calculator}
            active={activeTab === "calculator"}
            onClick={() => setActiveTab("calculator")}
            title="Identifier"
          />
          <SidebarButton
            icon={Target}
            active={activeTab === "goal"}
            onClick={() => setActiveTab("goal")}
            title="Goal"
          />
          <SidebarButton
            icon={Search}
            active={activeTab === "manual"}
            onClick={() => setActiveTab("manual")}
            title="Manual"
          />
          <div className="flex-1" />
          <SidebarButton
            icon={theme === "dark" ? Sun : Moon}
            active={false}
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          />
        </aside>
        <main className="flex-1 w-full overflow-y-auto p-10 flex flex-col"
          style={{ backgroundColor: "var(--color-bg-main)", color: "var(--color-text-main)" }}>
          {activeTab === "graph" && <GraphView />}
          {activeTab === "majors" && <MajorsView />}
          {activeTab === "courses" && (
            <CoursesView passedIds={passedIds} setPassedIds={setPassedIds} />
          )}
          {activeTab === "planner" && (
            <PlannerView
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
            <MajorCalculatorView
              passedIds={passedIds}
              setPassedIds={setPassedIds}
            />
          )}
          {activeTab === "goal" && <GoalPlannerView passedIds={passedIds} />}
          {activeTab === "manual" && (
            <ManualPlannerView
              passedIds={passedIds}
              roadmap={manualRoadmap}
              setRoadmap={setManualRoadmap}
            />
          )}
          {activeTab === "wizard" && (
            <StepWizard
              passedIds={passedIds}
              setPassedIds={setPassedIds}
              roadmapData={roadmapData}
              setRoadmapData={setRoadmapData}
              loading={plannerLoading}
              setLoading={setPlannerLoading}
            />
          )}
        </main>
      </div>
      <StickyTracker
        count={passedIds.length}
        activeTab={activeTab}
        onGenerate={() => setTriggerGenerate((v) => v + 1)}
      />
    </div>
  );
}