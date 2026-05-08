import React from "react";

export function Header({activeTab, setActiveTab}: any) {
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
                    <button className={`menu-item ${activeTab === 'planner' ? 'active' : ''}`}
                            onClick={() => setActiveTab('planner')}>Планировщик
                    </button>
                    <button className={`menu-item ${activeTab === 'graph' ? 'active' : ''}`}
                            onClick={() => setActiveTab('graph')}>Карта курсов
                    </button>
                    <button className={`menu-item ${activeTab === 'courses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('courses')}>Каталог
                    </button>
                    <button className={`menu-item ${activeTab === 'calculator' ? 'active' : ''}`}
                            onClick={() => setActiveTab('calculator')}>Подбор мейджора
                    </button>
                    <button className={`menu-item ${activeTab === 'goal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('goal')}>Цель
                    </button>
                    <button className={`menu-item ${activeTab === 'manual' ? 'active' : ''}`}
                            onClick={() => setActiveTab('manual')}>Песочница
                    </button>
                </nav>
            </div>
            <div className="header-right">
                <div className="user-profile">
                    <span className="text-muted"
                          style={{fontSize: '0.8rem', marginRight: '12px'}}>Тестовый Студент</span>
                    <div className="profile-circle">ТС</div>
                </div>
            </div>
        </header>
    );
}