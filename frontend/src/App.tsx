import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, Calendar, Network as NetworkIcon, Calculator, Search, Trash, X, Target } from 'lucide-react';
import { Network } from 'vis-network/standalone';
import './App.css';

const API_BASE = '/api/v1';

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

function Header({ activeTab, setActiveTab }: any) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="cu-logo">
          <svg viewBox="0 0 40 40" width="24" height="24" fill="#111">
            <path d="M20 5L35 12.5V27.5L20 35L5 27.5V12.5L20 5Z"/>
          </svg>
          <div className="logo-text">ROADMAP ENGINE</div>
        </div>
        <nav className="top-menu">
          <button className={`menu-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>Планировщик</button>
          <button className={`menu-item ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>Карта курсов</button>
          <button className={`menu-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>Каталог</button>
          <button className={`menu-item ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>Подбор мейджора</button>
          <button className={`menu-item ${activeTab === 'goal' ? 'active' : ''}`} onClick={() => setActiveTab('goal')}>Цель</button>
          <button className={`menu-item ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>Песочница</button>
        </nav>
      </div>
      <div className="header-right">
        <div className="user-profile">
          <span className="text-muted" style={{fontSize: '0.8rem', marginRight: '12px'}}>Тестовый Студент</span>
          <div className="profile-circle">ТС</div>
        </div>
      </div>
    </header>
  );
}

function StickyTracker({ count, activeTab, onGenerate }: any) {
  if (activeTab !== 'planner' && activeTab !== 'courses' && activeTab !== 'calculator' && activeTab !== 'goal' && activeTab !== 'manual') return null;
  
  return (
    <div className="sticky-tracker">
      <div className="tracker-content">
        <div className="stat">
          <span className="label">ВЫБРАНО КУРСОВ</span>
          <span className="value">{count}</span>
        </div>
        <div className="divider" />
        <div className="status">
          <span className="label">СТАТУС ПЛАНА</span>
          <span className="value success">{count > 0 ? 'ГОТОВ' : 'ПУСТО'}</span>
        </div>
        {activeTab === 'planner' && (
            <button className="primary-btn" onClick={onGenerate}>ПОСТРОИТЬ ТРАЕКТОРИЮ</button>
        )}
      </div>
    </div>
  );
}

function GraphView() {
  const container = React.useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/graph/data/`).then(res => {
      const nodes = res.data.nodes.map((n: any) => ({
          ...n,
          shape: 'dot',
          size: 20,
          font: { face: 'Inter', size: 12, color: '#111' },
          color: {
              background: '#fff',
              border: '#3b82f6',
              highlight: { background: '#eff6ff', border: '#2563eb' }
          },
          borderWidth: 2
      }));

      const edges = res.data.edges.map((e: any) => ({
          ...e,
          arrows: 'to',
          color: { color: '#e5e7eb', highlight: '#3b82f6' },
          font: { align: 'middle', color: '#94a3b8', size: 10, face: 'Inter' },
          dashes: e.label !== 'prerequisite'
      }));

      const network = new Network(container.current!, { nodes, edges }, {
          physics: { 
              solver: 'forceAtlas2Based',
              forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 }
          }
      });

      network.on("click", (params) => {
          if (params.nodes.length > 0) {
              const node = nodes.find((n: any) => n.id === params.nodes[0]);
              setSelectedNode(node);
          } else {
              setSelectedNode(null);
          }
      });
    });
  }, []);

  return (
    <div className="view-container full-height-view" style={{position: 'relative', display: 'flex', flexDirection: 'column'}}>
      <h1 className="view-title" style={{marginBottom: '20px'}}>Карта связей</h1>
      <div ref={container} className="graph-viz-container"></div>
      {selectedNode && (
        <div className="glass-panel" style={{
            position: 'absolute', top: '100px', right: '40px', width: '300px', 
            padding: '24px', zIndex: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <button onClick={() => setSelectedNode(null)} style={{position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer'}}><X size={16}/></button>
          <span className="badge" style={{marginBottom: '8px'}}>{selectedNode.group}</span>
          <h3 style={{fontSize: '1.2rem', marginBottom: '8px'}}>{selectedNode.label}</h3>
          <p className="text-muted" style={{fontSize: '0.9rem'}}>{selectedNode.title}</p>
        </div>
      )}
    </div>
  );
}

function MajorsView() {
  return <div className="view-container"><h1 className="view-title">Направления обучения</h1></div>;
}

function CoursesView({ passedIds, setPassedIds }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then(res => setCourses(res.data));
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds((prev: string[]) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getCategoryColor = (category: string) => {
      const cat = category.toLowerCase();
      if (cat.includes('stem')) return 'var(--cat-stem)';
      if (cat.includes('business')) return 'var(--cat-english)';
      if (cat.includes('tech')) return 'var(--cat-ai)';
      if (cat.includes('soft')) return 'var(--cat-agile)';
      return 'var(--cat-math)';
  };

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="view-container">
      <div className="breadcrumb">Траектория &gt; Каталог курсов</div>
      <h1 className="view-title">Курсы и навыки</h1>
      
      <div className="courses-grid">
        {filtered.map(c => (
          <div key={c.id} className={`cu-course-card ${passedIds.includes(c.id) ? 'selected' : ''}`} onClick={() => toggleCourse(c.id)}>
            <div className="card-top" style={{backgroundColor: getCategoryColor(c.category)}}>
              <div className="abstract-lines">
                  <svg width="100%" height="100%" viewBox="0 0 200 120" opacity="0.4">
                      <path d="M20 60 Q100 20 180 60" stroke="white" fill="none" strokeWidth="1"/>
                      <path d="M20 70 Q100 30 180 70" stroke="white" fill="none" strokeWidth="1"/>
                      <path d="M20 80 Q100 40 180 80" stroke="white" fill="none" strokeWidth="1"/>
                  </svg>
              </div>
              <div className="card-icon-circle">
                  <Search size={14} color={getCategoryColor(c.category)}/>
              </div>
            </div>
            <div className="card-bottom">
              <div className="card-title">{c.title}</div>
              <div className="card-meta">{c.category} • {c.workload} к.</div>
            </div>
            {passedIds.includes(c.id) && <div className="passed-badge">ПРОЙДЕНО</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlannerView({ passedIds, setPassedIds, triggerGenerate, setData, data, setLoading, loading }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [startSem, setStartSem] = useState(1);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then(res => setCourses(res.data));
    axios.get(`${API_BASE}/majors/`).then(res => {
        setMajors(res.data);
        if (res.data.length > 0) setSelectedMajor(res.data[0].id);
    });
  }, []);

  const generatePlan = () => {
    if (!selectedMajor) return;
    setLoading(true);
    axios.post(`${API_BASE}/planner/generate/`, {
        passed_course_ids: passedIds,
        major_id: selectedMajor,
        current_semester: startSem,
        max_load: 12.0
    }).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
      if (triggerGenerate > 0) generatePlan();
  }, [triggerGenerate]);

  const fixPrereq = (courseTitle: string) => {
      const target = courses.find(c => courseTitle.includes(c.title));
      if (target && !passedIds.includes(target.id)) {
          setPassedIds((prev: string[]) => [...prev, target.id]);
          setTimeout(generatePlan, 100);
      }
  };

  return (
    <div className="view-container">
      <div className="breadcrumb">Траектория &gt; Планировщик</div>
      <h1 className="view-title">Построение траектории</h1>
      <p className="text-muted" style={{marginBottom: 20}}>Укажите мейджор и семестр, с которого вы хотите начать планирование.</p>

      <div className="planner-header">
            <div className="form-group" style={{flex: 1}}>
                <label>Целевое направление (Major)</label>
                <select value={selectedMajor} onChange={e => setSelectedMajor(e.target.value)} className="planner-select">
                    {majors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            </div>
            <div className="form-group" style={{width: '180px'}}>
                <label>Текущий семестр</label>
                <input type="number" value={startSem} onChange={e => setStartSem(parseInt(e.target.value))} min={1} max={8} className="planner-input" />
            </div>
            <button className="primary-btn" onClick={generatePlan} disabled={loading} style={{height: '42px'}}>
                {loading ? 'Строим...' : 'Рассчитать'}
            </button>
      </div>

      {data && data.roadmap && (
        <div className="planner-view" style={{marginTop: 40}}>
          <div className="timeline">
            {data.roadmap.map((sem: any, idx: number) => (
              <div key={idx} className="semester-block">
                <div className="sem-header">
                  <h3>Семестр {sem.semester}</h3>
                  <span className="load-badge">Нагрузка: {(sem.total_load || 0).toFixed(1)} / 12.0</span>
                </div>
                {sem.error && typeof sem.error === 'string' && (
                    <div className="error-text">
                        <span>⚠️ {sem.error}</span>
                        {(sem.error.includes('пререквизиты') || sem.error.includes('prereqs')) && (
                            <button className="fix-btn" onClick={() => fixPrereq(sem.error)}>
                                ИСПРАВИТЬ
                            </button>
                        )}
                    </div>
                )}
                <div className="sem-courses">
                  {sem.courses.map((c: any) => (
                    <div key={c.id} className="sem-course-card">
                      <strong>{c.title}</strong>
                      <div className="course-meta">
                        <span className="badge">{c.type}</span>
                        <span className="text-muted">{c.workload} к.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MajorCalculatorView({ passedIds, setPassedIds }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then(res => setCourses(res.data));
  }, []);

  const calculate = () => {
    setLoading(true);
    axios.post(`${API_BASE}/majors/identify/`, passedIds).then(res => {
      setResults(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div className="view-container">
      <h1 className="view-title">Подбор мейджора</h1>
      <p className="text-muted" style={{marginBottom: 24}}>Система проанализирует выбранные курсы и подскажет наиболее подходящее направление.</p>
      
      <div style={{display: 'flex', gap: '20px', marginBottom: '32px'}}>
          <button className="primary-btn" onClick={calculate} disabled={loading}>
              {loading ? 'Анализируем...' : 'Рассчитать соответствие'}
          </button>
      </div>

      <div className="majors-grid">
        {results.map(r => (
          <div key={r.id} className="cu-course-card" style={{padding: '24px', cursor: 'default'}}>
             <h2 style={{fontSize: '1.2rem', marginBottom: '8px', color: '#111'}}>{r.title}</h2>
             <div className="score-text" style={{color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem'}}>
                {(r.score * 100).toFixed(0)}%
             </div>
             <div className="progress-bar" style={{height: '6px', background: '#eee', borderRadius: '3px', marginTop: '12px', overflow: 'hidden'}}>
                <div style={{width: `${r.score * 100}%`, height: '100%', background: 'var(--primary)'}} />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function GoalPlannerView({ passedIds }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [targetId, setTargetId] = useState('');
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then(res => setCourses(res.data));
  }, []);

  const generatePath = () => {
    if (!targetId) return;
    setLoading(true);
    axios.post(`${API_BASE}/planner/goal-path/`, {
      target_course_id: targetId,
      passed_course_ids: passedIds,
      current_semester: 1,
      max_load: 12.0
    }).then(res => {
      setRoadmap(res.data.roadmap);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div className="view-container">
      <h1 className="view-title">Планирование от цели</h1>
      <p className="text-muted" style={{marginBottom: 24}}>Выберите курс, который вы хотите пройти в будущем, и система построит кратчайший путь до него.</p>
      
      <div className="planner-header">
            <div className="form-group" style={{flex: 1}}>
                <label>Целевой курс</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="planner-select">
                    <option value="">Выберите курс...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
            </div>
            <button className="primary-btn" onClick={generatePath} disabled={loading || !targetId} style={{height: '42px'}}>
                {loading ? 'Строим...' : 'Построить путь'}
            </button>
      </div>

      {roadmap.length > 0 && (
        <div className="planner-view" style={{marginTop: 40}}>
          <div className="timeline">
            {roadmap.map((sem: any, idx: number) => (
              <div key={idx} className="semester-block">
                <div className="sem-header">
                  <h3>Семестр {sem.semester}</h3>
                  {sem.total_load && <span className="load-badge">Нагрузка: {sem.total_load.toFixed(1)}</span>}
                </div>
                {sem.error && <div className="error-text">⚠️ {sem.error}</div>}
                {sem.status && <div className="text-muted" style={{fontSize: '0.8rem', marginBottom: 8}}>{sem.status}</div>}
                <div className="sem-courses">
                  {(sem.courses || []).map((c: any) => (
                    <div key={c.id} className="sem-course-card">
                      <strong>{c.title}</strong>
                      <div className="course-meta">
                        <span className="text-muted">{c.workload} к.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ManualPlannerView({ passedIds, roadmap, setRoadmap }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [validation, setValidation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then(res => setCourses(res.data));
  }, []);

  const validate = () => {
    setLoading(true);
    axios.post(`${API_BASE}/planner/validate-roadmap/`, {
      passed_course_ids: passedIds,
      roadmap: roadmap,
      max_load: 12.0
    }).then(res => {
      setValidation(res.data.validation_results);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const addCourse = (semIdx: number, courseId: string) => {
    if (!courseId) return;
    const newRoadmap = [...roadmap];
    if (!newRoadmap[semIdx].course_ids.includes(courseId)) {
        newRoadmap[semIdx].course_ids = [...newRoadmap[semIdx].course_ids, courseId];
        setRoadmap(newRoadmap);
    }
  };

  const removeCourse = (semIdx: number, courseId: string) => {
    const newRoadmap = [...roadmap];
    newRoadmap[semIdx].course_ids = newRoadmap[semIdx].course_ids.filter((id: string) => id !== courseId);
    setRoadmap(newRoadmap);
  };

  return (
    <div className="view-container">
      <h1 className="view-title">Песочница (Ручное планирование)</h1>
      <p className="text-muted" style={{marginBottom: 24}}>Расставьте курсы по семестрам самостоятельно и проверьте план на корректность.</p>
      
      <div style={{marginBottom: 24}}>
          <button className="primary-btn" onClick={validate} disabled={loading}>
              {loading ? 'Проверяем...' : 'Проверить план'}
          </button>
      </div>

      <div className="planner-view">
        <div className="timeline">
          {roadmap.map((sem: any, idx: number) => {
            const v = validation.find(res => res.semester === sem.semester);
            return (
              <div key={idx} className="semester-block" style={{border: v && !v.valid ? '2px solid #fee2e2' : 'none'}}>
                <div className="sem-header">
                  <h3>Семестр {sem.semester}</h3>
                  {v && <span className={`load-badge ${v.total_load > 12 ? 'error' : ''}`}>Нагрузка: {v.total_load.toFixed(1)}</span>}
                </div>
                
                {v && v.messages.map((m: any, midx: number) => (
                    <div key={midx} className={`error-text ${m.level}`} style={{fontSize: '0.8rem', marginBottom: 4}}>
                        {m.level === 'error' ? '❌' : '⚠️'} {m.message}
                    </div>
                ))}

                <div className="sem-courses" style={{minHeight: '60px', background: '#f8fafc', padding: '12px', borderRadius: '12px'}}>
                  {sem.course_ids.map((cid: string) => {
                    const c = courses.find(item => item.id === cid);
                    return (
                      <div key={cid} className="sem-course-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <strong>{c?.title || cid}</strong>
                        <button onClick={() => removeCourse(idx, cid)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}><Trash size={14}/></button>
                      </div>
                    );
                  })}
                </div>
                
                <select 
                    className="planner-select" 
                    style={{marginTop: 8, fontSize: '0.8rem', padding: '4px 8px'}}
                    onChange={(e) => { addCourse(idx, e.target.value); e.target.value = ''; }}
                >
                    <option value="">+ Добавить курс</option>
                    {courses.filter(c => !roadmap.some((s: any) => s.course_ids.includes(c.id))).map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
