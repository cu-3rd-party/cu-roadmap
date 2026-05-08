import React, {useEffect, useState} from "react";
import axios from "axios";
import {API_BASE} from "../consts";

export function MajorCalculatorView({passedIds, setPassedIds}: any) {
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
            <p className="text-muted" style={{marginBottom: 24}}>Система проанализирует выбранные курсы и подскажет
                наиболее подходящее направление.</p>

            <div style={{display: 'flex', gap: '20px', marginBottom: '32px'}}>
                <button className="primary-btn" onClick={calculate} disabled={loading}>
                    {loading ? 'Анализируем...' : 'Рассчитать соответствие'}
                </button>
            </div>

            <div className="majors-grid">
                {results.map(r => (
                    <div key={r.id} className="cu-course-card" style={{padding: '24px', cursor: 'default'}}>
                        <h2 style={{fontSize: '1.2rem', marginBottom: '8px', color: '#111'}}>{r.title}</h2>
                        <div className="score-text"
                             style={{color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem'}}>
                            {(r.score * 100).toFixed(0)}%
                        </div>
                        <div className="progress-bar" style={{
                            height: '6px',
                            background: '#eee',
                            borderRadius: '3px',
                            marginTop: '12px',
                            overflow: 'hidden'
                        }}>
                            <div style={{width: `${r.score * 100}%`, height: '100%', background: 'var(--primary)'}}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}