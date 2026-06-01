import { Lock } from "lucide-react";

interface StatusPanelProps {
  title: string;
  description: string;
}

export const StatusPanel = ({ title, description }: StatusPanelProps) => (
  <div className="flex flex-col gap-0.5 rounded-xl bg-negative-pale p-3">
    <div className="flex items-center gap-2 font-medium text-fg-negative text-base">
      <Lock className="size-4 shrink-0" />
      {title}
    </div>
    <p className="pl-6 text-sm text-fg-secondary">{description}</p>
  </div>
);
