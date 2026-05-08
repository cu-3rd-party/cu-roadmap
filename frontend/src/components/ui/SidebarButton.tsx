import type { LucideIcon } from "lucide-react";

interface SidebarButtonProps {
  icon: LucideIcon;
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
      className={`p-2.5 rounded-xl border-none transition-all duration-200 ${
        active ? "text-primary" : "hover:text-gray-700"
      }`}
      style={{
        backgroundColor: active ? "var(--color-bg-hover)" : "transparent",
        color: active ? "var(--color-primary)" : "var(--color-text-muted)",
      }}
      onClick={onClick}
      title={title}
    >
      <Icon size={20} />
    </button>
  );
}
