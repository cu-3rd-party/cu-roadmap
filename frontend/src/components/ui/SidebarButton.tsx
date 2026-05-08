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
        active
          ? "text-primary bg-blue-50"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
      }`}
      onClick={onClick}
      title={title}
    >
      <Icon size={20} />
    </button>
  );
}
