import React from "react";

export function AISparkleBox() {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="2"
      >
        <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" />
        <path d="M5 19L5.4 17H3.6L5 19Z" opacity="0.5" />
        <path d="M19 19L18.6 17H16.6L19 19Z" opacity="0.5" />
      </svg>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        Система автоматически подберёт оптимальный порядок курсов с учётом пререквизитов,
        кореквизитов и вашей нагрузки.
      </p>
    </div>
  );
}