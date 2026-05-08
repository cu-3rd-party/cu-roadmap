import React from "react";

interface SidebarButtonProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  onClick: () => void;
  title: string;
}

export function SidebarButton({
  icon: Icon,
  active,
  onClick,
  title,
}: SidebarButtonProps) {
  return (
    <button
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-none"
      onClick={onClick}
      title={title}
      style={{
        backgroundColor: active
          ? "var(--color-bg-hover)"
          : "transparent",
        color: active
          ? "var(--color-primary)"
          : "var(--color-text-muted)",
      }}
    >
      <Icon size={20} strokeWidth={1.8} />
    </button>
  );
}