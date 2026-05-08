import React, {useEffect, useState} from "react";
import axios from "axios";
import {API_BASE} from "../consts";
import {Search} from "lucide-react";

export function CoursesView({passedIds, setPassedIds}: any) {
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
                    <div key={c.id} className={`cu-course-card ${passedIds.includes(c.id) ? 'selected' : ''}`}
                         onClick={() => toggleCourse(c.id)}>
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