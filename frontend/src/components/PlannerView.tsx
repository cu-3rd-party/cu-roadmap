import React, {useEffect, useState} from "react";
import axios from "axios";
import {API_BASE} from "../consts";

export function PlannerView({passedIds, setPassedIds, triggerGenerate, setData, data, setLoading, loading}: any) {
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
            <p className="text-muted" style={{marginBottom: 20}}>Укажите мейджор и семестр, с которого вы хотите начать
                планирование.</p>

            <div className="planner-header">
                <div className="form-group" style={{flex: 1}}>
                    <label>Целевое направление (Major)</label>
                    <select value={selectedMajor} onChange={e => setSelectedMajor(e.target.value)}
                            className="planner-select">
                        {majors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{width: '180px'}}>
                    <label>Текущий семестр</label>
                    <input type="number" value={startSem} onChange={e => setStartSem(parseInt(e.target.value))} min={1}
                           max={8} className="planner-input"/>
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
                                    <span
                                        className="load-badge">Нагрузка: {(sem.total_load || 0).toFixed(1)} / 12.0</span>
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