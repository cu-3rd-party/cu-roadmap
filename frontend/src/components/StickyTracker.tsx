import React from "react";

export function StickyTracker({count, activeTab, onGenerate}: any) {
    if (activeTab !== 'planner' && activeTab !== 'courses' && activeTab !== 'calculator' && activeTab !== 'goal' && activeTab !== 'manual') return null;

    return (
        <div className="sticky-tracker">
            <div className="tracker-content">
                <div className="stat">
                    <span className="label">ВЫБРАНО КУРСОВ</span>
                    <span className="value">{count}</span>
                </div>
                <div className="divider"/>
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