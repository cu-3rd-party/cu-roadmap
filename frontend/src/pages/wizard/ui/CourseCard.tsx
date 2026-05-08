import React from "react";
import { getCategoryColor } from "../config/category-colors";
import { Check, Search } from "lucide-react";

interface Course {
  id: string;
  title: string;
  category: string;
  workload: number;
}

interface CourseCardProps {
  course: Course;
  isSelected: boolean;
  onToggle: () => void;
}

export function CourseCard({ course, isSelected, onToggle }: CourseCardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden cursor-pointer border transition-all hover:-translate-y-1 hover:shadow-lg select-none ${
        isSelected ? "border-2" : ""
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
        className="h-28 relative"
        style={{ backgroundColor: getCategoryColor(course.category) }}
      >
        <svg width="100%" height="100%" viewBox="0 0 200 120" opacity="0.4">
          <path
            d="M20 60 Q100 20 180 60"
            stroke="white"
            fill="none"
            strokeWidth="1"
          />
          <path
            d="M20 70 Q100 30 180 70"
            stroke="white"
            fill="none"
            strokeWidth="1"
          />
          <path
            d="M20 80 Q100 40 180 80"
            stroke="white"
            fill="none"
            strokeWidth="1"
          />
        </svg>
        {isSelected && (
          <div
            className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Check size={16} color="white" />
          </div>
        )}
        <div
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
          style={{ backgroundColor: "var(--color-bg-main)" }}
        >
          <Search size={14} color={getCategoryColor(course.category)} />
        </div>
      </div>
      <div className="p-4">
        <div
          className="font-bold text-base mb-1 leading-snug"
          style={{ color: "var(--color-text-main)" }}
        >
          {course.title}
        </div>
        <div
          className="text-xs font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          {course.category} • {course.workload} к.
        </div>
      </div>
    </div>
  );
}
