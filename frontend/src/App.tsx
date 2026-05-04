import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
import { Book, Network as NetworkIcon, GraduationCap, X, LayoutDashboard, Search } from 'lucide-react';
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
