import React, {useEffect, useState} from "react";
import axios from "axios";
import {API_BASE} from "../consts";
import {Trash} from "lucide-react";

export function ManualPlannerView({passedIds, roadmap, setRoadmap}: any) {
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
            <p className="text-muted" style={{marginBottom: 24}}>Расставьте курсы по семестрам самостоятельно и
                проверьте план на корректность.</p>

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
                            <div key={idx} className="semester-block"
                                 style={{border: v && !v.valid ? '2px solid #fee2e2' : 'none'}}>
                                <div className="sem-header">
                                    <h3>Семестр {sem.semester}</h3>
                                    {v && <span
                                        className={`load-badge ${v.total_load > 12 ? 'error' : ''}`}>Нагрузка: {v.total_load.toFixed(1)}</span>}
                                </div>

                                {v && v.messages.map((m: any, midx: number) => (
                                    <div key={midx} className={`error-text ${m.level}`}
                                         style={{fontSize: '0.8rem', marginBottom: 4}}>
                                        {m.level === 'error' ? '❌' : '⚠️'} {m.message}
                                    </div>
                                ))}

                                <div className="sem-courses" style={{
                                    minHeight: '60px',
                                    background: '#f8fafc',
                                    padding: '12px',
                                    borderRadius: '12px'
                                }}>
                                    {sem.course_ids.map((cid: string) => {
                                        const c = courses.find(item => item.id === cid);
                                        return (
                                            <div key={cid} className="sem-course-card" style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <strong>{c?.title || cid}</strong>
                                                <button onClick={() => removeCourse(idx, cid)} style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer'
                                                }}><Trash size={14}/></button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <select
                                    className="planner-select"
                                    style={{marginTop: 8, fontSize: '0.8rem', padding: '4px 8px'}}
                                    onChange={(e) => {
                                        addCourse(idx, e.target.value);
                                        e.target.value = '';
                                    }}
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