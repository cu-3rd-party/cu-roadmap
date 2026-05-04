import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
import { Book, Network as NetworkIcon, GraduationCap, X, LayoutDashboard, Search, Calendar, Calculator } from 'lucide-react';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('graph');
  
  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'graph' && <GraphView />}
        {activeTab === 'majors' && <MajorsView />}
        {activeTab === 'courses' && <CoursesView />}
        {activeTab === 'planner' && <PlannerView />}
        {activeTab === 'calculator' && <MajorCalculatorView />}
      </main>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab }: any) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <LayoutDashboard className="icon-lg" />
        <h2>CU Admin</h2>
      </div>
      <nav className="sidebar-nav">
        <button className={`nav-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
          <NetworkIcon className="icon" /> Graph View
        </button>
        <button className={`nav-btn ${activeTab === 'majors' ? 'active' : ''}`} onClick={() => setActiveTab('majors')}>
          <GraduationCap className="icon" /> Majors
        </button>
        <button className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
          <Book className="icon" /> Courses
        </button>
        <button className={`nav-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>
          <Calendar className="icon" /> Planner (Eng2)
        </button>
        <button className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>
          <Calculator className="icon" /> Identifier
        </button>
      </nav>
    </aside>
  );
}

function GraphView() {
  const container = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!container.current) return;
    axios.get(`${API_BASE}/graph-data`).then((res) => {
      const data = res.data;
      const colorMap: any = {
          'tech': { background: '#3b82f6', border: '#2563eb' },
          'stem': { background: '#8b5cf6', border: '#7c3aed' },
          'business': { background: '#10b981', border: '#059669' },
          'soft': { background: '#f59e0b', border: '#d97706' },
      };

      const nodes = data.nodes.map((n: any) => ({
          ...n,
          color: {
              background: colorMap[n.group]?.background || '#64748b',
              border: colorMap[n.group]?.border || '#475569',
              highlight: { background: '#38bdf8', border: '#0ea5e9' }
          },
          font: { color: '#ffffff', face: 'Inter', size: 14 },
          shape: 'box',
          borderWidth: 2,
          margin: 12,
      }));

      const edges = data.edges.map((e: any) => ({
          ...e,
          arrows: 'to',
          color: { color: 'rgba(148, 163, 184, 0.4)', highlight: '#38bdf8' },
          font: { align: 'middle', color: '#94a3b8', size: 10, face: 'Inter' },
          dashes: e.label !== 'prerequisite'
      }));

      const network = new Network(container.current!, { nodes, edges }, {
          physics: { solver: 'forceAtlas2Based' }
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
    <div className="view-container">
      <div ref={container} className="graph-container"></div>
      {selectedNode && (
        <div className="glass-panel info-panel">
          <button className="close-btn" onClick={() => setSelectedNode(null)}><X size={16}/></button>
          <span className="badge">{selectedNode.group}</span>
          <h3>{selectedNode.label}</h3>
          <p className="text-muted">{selectedNode.title}</p>
        </div>
      )}
    </div>
  );
}

function MajorsView() {
  const [majors, setMajors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API_BASE}/majors`).then(res => setMajors(res.data));
    axios.get(`${API_BASE}/courses`).then(res => setCourses(res.data));
  }, []);

  return (
    <div className="view-container scrollable">
      <h1 className="page-title">Majors & Requirements</h1>
      <div className="majors-grid">
        {majors.map(m => (
          <div key={m.id} className="glass-panel major-card">
            <h2>{m.title}</h2>
            <p className="school-tag">{m.school} School</p>
            <div className="requirements">
              <h4>Required Courses ({m.requirements.length}):</h4>
              {m.requirements.length === 0 ? <p className="text-muted">No specific requirements set yet.</p> : (
                <ul>
                  {m.requirements.map((req: any) => {
                    const c = courses.find(c => c.id === req.course_id);
                    return <li key={req.course_id}>{c ? c.title : req.course_id} <span>({req.type})</span></li>
                  })}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoursesView() {
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/courses`).then(res => setCourses(res.data));
  }, []);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="view-container scrollable">
      <div className="header-row">
        <h1 className="page-title">All Courses</h1>
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-container glass-panel">
        <table className="courses-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Semesters</th>
              <th>Load</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td><strong>{c.title}</strong><br/><small className="text-muted">{c.description}</small></td>
                <td><span className="badge">{c.category}</span></td>
                <td>{c.course_type}</td>
                <td>{c.available_semesters.join(', ')}</td>
                <td>{c.workload}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlannerView() {
  const [courses, setCourses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  
  const [selectedMajor, setSelectedMajor] = useState('');
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [startSem, setStartSem] = useState(1);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses`).then(res => setCourses(res.data));
    axios.get(`${API_BASE}/majors`).then(res => {
        setMajors(res.data);
        if (res.data.length > 0) setSelectedMajor(res.data[0].id);
    });
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const generatePlan = () => {
    if (!selectedMajor) return;
    setLoading(true);
    axios.post(`${API_BASE}/planner/generate`, {
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

  return (
    <div className="view-container scrollable">
      <h1 className="page-title">Roadmap Planner (Engine 2)</h1>
      <p className="text-muted" style={{marginBottom: 20}}>Specify your major and already passed courses to see your future path.</p>

      <div className="planner-config glass-panel" style={{padding: 24, marginBottom: 32}}>
        <div className="config-row" style={{display: 'flex', gap: 24, marginBottom: 16}}>
            <div className="config-group" style={{flex: 1}}>
                <label style={{display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-muted)'}}>Target Major</label>
                <select 
                    value={selectedMajor} 
                    onChange={e => setSelectedMajor(e.target.value)}
                    style={{width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '6px'}}
                >
                    <option value="">Select a Major...</option>
                    {majors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            </div>
            <div className="config-group" style={{width: '180px'}}>
                <label style={{display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-muted)'}}>Plan from Semester</label>
                <input 
                    type="number" 
                    value={startSem} 
                    onChange={e => setStartSem(parseInt(e.target.value))} 
                    min={1} max={8} 
                    style={{width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '6px'}}
                />
            </div>
        </div>
        
        <div className="config-group">
            <label style={{display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-muted)'}}>Passed Courses</label>
            <div className="mini-selection-list">
                {courses.map(c => (
                    <label key={c.id} className={`mini-item ${passedIds.includes(c.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={passedIds.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                        {c.title}
                    </label>
                ))}
            </div>
        </div>

        <button className="generate-btn" onClick={generatePlan} disabled={loading || !selectedMajor} style={{marginTop: 20}}>
          {loading ? 'Generating...' : 'Build My Future Roadmap'}
        </button>
      </div>

      {data && data.roadmap && (
        <div className="roadmap-container">
          <div className="timeline">
            {data.roadmap.map((sem: any, idx: number) => (
              <div key={idx} className="semester-block glass-panel">
                <div className="sem-header">
                  <h3>Semester {sem.semester}</h3>
                  <span className="load-badge">Load: {sem.total_load.toFixed(1)} / 12.0</span>
                </div>
                {sem.error && <p className="error-text">{sem.error}</p>}
                {sem.courses.length === 0 && !sem.error ? <p className="text-muted">No courses matched constraints for this semester.</p> : null}
                <div className="sem-courses">
                  {sem.courses.map((c: any) => (
                    <div key={c.id} className="sem-course-card">
                      <strong>{c.title}</strong>
                      <div className="course-meta">
                        <span className="badge">{c.type}</span>
                        <span className="text-muted">Load: {c.workload}</span>
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

function MajorCalculatorView() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/courses`).then(res => setCourses(res.data));
  }, []);

  const toggleCourse = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const calculate = () => {
    setLoading(true);
    axios.post(`${API_BASE}/majors/identify`, selectedIds).then(res => {
      setResults(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div className="view-container scrollable">
      <h1 className="page-title">Major Identifier</h1>
      <p className="text-muted" style={{marginBottom: 24}}>Select the courses you've already passed to find out which Major they best correspond to.</p>
      
      <div className="calc-layout">
        <div className="glass-panel courses-selector">
          <h3>Select Passed Courses</h3>
          <div className="selection-list">
            {courses.map(c => (
              <label key={c.id} className={`selection-item ${selectedIds.includes(c.id) ? 'selected' : ''}`}>
                <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleCourse(c.id)} style={{marginRight: 10}} />
                <span>{c.title}</span>
              </label>
            ))}
          </div>
          <button className="generate-btn" onClick={calculate} disabled={loading || selectedIds.length === 0} style={{marginTop: 20, width: '100%'}}>
            {loading ? 'Analyzing...' : 'Identify Best Major'}
          </button>
        </div>

        <div className="results-panel">
          {results.length > 0 ? results.map(r => (
            <div key={r.id} className="glass-panel result-card">
              <div className="result-header">
                <h3>{r.title}</h3>
                <span className="score-text">{(r.score * 100).toFixed(1)}% Match</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${r.score * 100}%`}}></div>
              </div>
              <p className="text-muted" style={{marginTop: 10}}>{r.covered_count} of {r.total_count} required courses covered.</p>
            </div>
          )) : (
            <div className="glass-panel empty-results">
              <p className="text-muted">Select courses and click analyze to see results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
