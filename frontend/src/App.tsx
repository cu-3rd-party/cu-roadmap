import React, {useState} from 'react';
import {Book, Calculator, Calendar, Network as NetworkIcon, Search, Target} from 'lucide-react';
import './App.css';
import {Header} from "./components/Header";
import {StickyTracker} from "./components/StickyTracker";
import {GraphView} from "./components/GraphView";
import {MajorsView} from "./components/MajorsView";
import {CoursesView} from "./components/CoursesView";
import {PlannerView} from "./components/PlannerView";
import {MajorCalculatorView} from "./components/MajorCalculatorView";
import {GoalPlannerView} from "./components/GoalPlannerView";
import {ManualPlannerView} from "./components/ManualPlannerView";

export default function App() {
  const [activeTab, setActiveTab] = useState('courses');
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [manualRoadmap, setManualRoadmap] = useState<any[]>([
      { semester: 1, course_ids: [] },
      { semester: 2, course_ids: [] },
      { semester: 3, course_ids: [] },
      { semester: 4, course_ids: [] }
  ]);
  
  // Shared state for the planner results so we can trigger build from tracker
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [triggerGenerate, setTriggerGenerate] = useState(0);

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="layout-body">
        <aside className="narrow-sidebar">
          <button className={`side-icon-btn ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')} title="Courses"><Book size={20}/></button>
          <button className={`side-icon-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')} title="Planner"><Calendar size={20}/></button>
          <button className={`side-icon-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')} title="Graph"><NetworkIcon size={20}/></button>
          <button className={`side-icon-btn ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')} title="Identifier"><Calculator size={20}/></button>
          <button className={`side-icon-btn ${activeTab === 'goal' ? 'active' : ''}`} onClick={() => setActiveTab('goal')} title="Goal"><Target size={20}/></button>
          <button className={`side-icon-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')} title="Manual"><Search size={20}/></button>
        </aside>
        <main className="main-content">
          {activeTab === 'graph' && <GraphView />}
          {activeTab === 'majors' && <MajorsView />}
          {activeTab === 'courses' && <CoursesView passedIds={passedIds} setPassedIds={setPassedIds} />}
          {activeTab === 'planner' && (
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
          {activeTab === 'calculator' && <MajorCalculatorView passedIds={passedIds} setPassedIds={setPassedIds} />}
          {activeTab === 'goal' && <GoalPlannerView passedIds={passedIds} />}
          {activeTab === 'manual' && <ManualPlannerView passedIds={passedIds} roadmap={manualRoadmap} setRoadmap={setManualRoadmap} />}
        </main>
      </div>
      <StickyTracker 
        count={passedIds.length} 
        activeTab={activeTab} 
        onGenerate={() => setTriggerGenerate(v => v + 1)}
      />
    </div>
  );
}

