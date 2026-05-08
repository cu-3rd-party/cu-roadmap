import {getCategoryColor} from "./helpers";
import {Check} from "lucide-react";
import React from "react";

interface CourseCardProps {
    course: { id: string; title: string; category: string; workload: number };
    isSelected: boolean;
    onToggle: () => void;
}

export function CourseCard({course, isSelected, onToggle}: CourseCardProps) {
    return (
        <div
            className={`bg-white rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:shadow-md ${
                isSelected ? "border-primary shadow-sm" : "border-gray-100 hover:border-gray-300"
            }`}
            onClick={onToggle}
        >
            <div
                className="h-24 relative"
                style={{backgroundColor: getCategoryColor(course.category)}}
            >
                <svg width="100%" height="100%" viewBox="0 0 200 80" opacity="0.3">
                    <path d="M20 40 Q100 10 180 40" stroke="white" fill="none" strokeWidth="1"/>
                </svg>
                {isSelected && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                        <Check size={14} className="text-primary"/>
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="font-bold text-sm mb-1 text-gray-900">{course.title}</div>
                <div className="text-xs text-gray-500">
                    {course.category} • {course.workload} к.
                </div>
            </div>
        </div>
    );
}