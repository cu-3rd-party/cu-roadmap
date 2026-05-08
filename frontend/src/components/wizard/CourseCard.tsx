import { getCategoryColor } from "./helpers";
import { Check } from "lucide-react";
import React from "react";

interface CourseCardProps {
  course: { id: string; title: string; category: string; workload: number };
  isSelected: boolean;
  onToggle: () => void;
}

export function CourseCard({ course, isSelected, onToggle }: CourseCardProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:shadow-md ${
        isSelected ? "shadow-sm" : ""
      }`}
      style={{
        backgroundColor: "var(--color-bg-main)",
        borderColor: isSelected
          ? "var(--color-primary)"
          : "var(--color-border)",
      }}
      onClick={onToggle}
    >
      <div
        className="h-24 relative"
        style={{ backgroundColor: getCategoryColor(course.category) }}
      >
        <svg width="100%" height="100%" viewBox="0 0 200 80" opacity="0.3">
          <path
            d="M20 40 Q100 10 180 40"
            stroke="white"
            fill="none"
            strokeWidth="1"
          />
        </svg>
        {isSelected && (
          <div
            className="absolute top-2 right-2 rounded-full p-1"
            style={{ backgroundColor: "var(--color-bg-main)" }}
          >
            <Check size={14} style={{ color: "var(--color-primary)" }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <div
          className="font-bold text-sm mb-1"
          style={{ color: "var(--color-text-main)" }}
        >
          {course.title}
        </div>
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {course.category} • {course.workload} к.
        </div>
      </div>
    </div>
  );
}
