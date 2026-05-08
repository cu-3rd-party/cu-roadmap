import React, { useState } from "react";
import {
  Book,
  Calculator,
  Calendar,
  Network as NetworkIcon,
  Search,
  Target,
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

export default function App() {
  const [activeTab, setActiveTab] = useState("courses");
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [manualRoadmap, setManualRoadmap] = useState<any[]>([
    { semester: 1, course_ids: [] },
    { semester: 2, course_ids: [] },
    { semester: 3, course_ids: [] },
    { semester: 4, course_ids: [] },
  ]);

  // Shared state for the planner results so we can trigger build from tracker
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [triggerGenerate, setTriggerGenerate] = useState(0);

  return (
    <div className="flex flex-col h-screen">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 w-full overflow-hidden">
        <aside className="hidden md:flex w-16 min-w-16 bg-white border-r border-gray-200 flex-col items-center pt-5 gap-4">
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "courses" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("courses")}
            title="Courses"
          >
            <Book size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "planner" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("planner")}
            title="Planner"
          >
            <Calendar size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "graph" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("graph")}
            title="Graph"
          >
            <NetworkIcon size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "calculator" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("calculator")}
            title="Identifier"
          >
            <Calculator size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "goal" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("goal")}
            title="Goal"
          >
            <Target size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "manual" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("manual")}
            title="Manual"
          >
            <Search size={20} />
          </button>
        </aside>
        <aside className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex flex-row items-center justify-center gap-2 px-4 z-40">
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "courses" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("courses")}
            title="Courses"
          >
            <Book size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "planner" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("planner")}
            title="Planner"
          >
            <Calendar size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "graph" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("graph")}
            title="Graph"
          >
            <NetworkIcon size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "calculator" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("calculator")}
            title="Identifier"
          >
            <Calculator size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "goal" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("goal")}
            title="Goal"
          >
            <Target size={20} />
          </button>
          <button
            className={`p-2.5 rounded-xl border-none transition-all duration-200 ${activeTab === "manual" ? "text-primary bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
            onClick={() => setActiveTab("manual")}
            title="Manual"
          >
            <Search size={20} />
          </button>
        </aside>
        <main className="flex-1 w-full bg-white overflow-y-auto p-10 flex flex-col">
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
