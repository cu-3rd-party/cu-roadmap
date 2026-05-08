import React from "react";

export function StickyTracker({count, activeTab, onGenerate}: any) {
    if (activeTab !== 'planner' && activeTab !== 'courses' && activeTab !== 'calculator' && activeTab !== 'goal' && activeTab !== 'manual') return null;

    return (
        <div className="hidden md:block fixed bottom-6 right-6 z-50">
            <div className="bg-white text-gray-900 px-5 py-3 rounded-xl flex items-center gap-5 shadow-lg border border-gray-200">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">ВЫБРАНО КУРСОВ</span>
                    <span className="text-sm font-extrabold">{count}</span>
                </div>
                <div className="w-px h-6 bg-gray-200"/>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">СТАТУС ПЛАНА</span>
                    <span className="text-sm font-extrabold text-green-600">{count > 0 ? 'ГОТОВ' : 'ПУСТО'}</span>
                </div>
                {activeTab === 'planner' && (
                    <button className="bg-primary text-white border-none px-4 py-2 rounded-lg font-bold text-sm cursor-pointer ml-2" onClick={onGenerate}>ПОСТРОИТЬ ТРАЕКТОРИЮ</button>
                )}
            </div>
        </div>
    );
}