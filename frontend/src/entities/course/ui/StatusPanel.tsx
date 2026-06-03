import { Lock } from "lucide-react";

interface StatusPanelProps {
  messages: string[];
}

export const StatusPanel = ({ messages }: StatusPanelProps) => (
  <div className="flex flex-col gap-1 rounded-xl bg-negative-pale p-3">
    <div className="flex items-center gap-3 text-base font-medium text-fg-negative">
      <Lock className="size-4 shrink-0" />
      Есть конфликты
    </div>
    <ul className="list-disc space-y-0.5 pl-10 text-sm text-fg-secondary">
      {messages.map((message, i) => (
        <li key={i}>{message}</li>
      ))}
    </ul>
  </div>
);
