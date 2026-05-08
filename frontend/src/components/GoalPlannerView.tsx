import React, {useEffect, useState} from "react";
import axios from "axios";
import {API_BASE} from "../consts";

export function GoalPlannerView({passedIds}: any) {
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
            <p className="text-muted" style={{marginBottom: 24}}>Выберите курс, который вы хотите пройти в будущем, и
                система построит кратчайший путь до него.</p>

            <div className="planner-header">
                <div className="form-group" style={{flex: 1}}>
                    <label>Целевой курс</label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className="planner-select">
                        <option value="">Выберите курс...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <button className="primary-btn" onClick={generatePath} disabled={loading || !targetId}
                        style={{height: '42px'}}>
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
                                    {sem.total_load &&
                                        <span className="load-badge">Нагрузка: {sem.total_load.toFixed(1)}</span>}
                                </div>
                                {sem.error && <div className="error-text">⚠️ {sem.error}</div>}
                                {sem.status && <div className="text-muted"
                                                    style={{fontSize: '0.8rem', marginBottom: 8}}>{sem.status}</div>}
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