import { X } from "lucide-react";

import type { GraphNode } from "@/shared/config";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";

interface GraphNodeDetailsPanelProps {
  node: GraphNode;
  onClose: () => void;
}

export function GraphNodeDetailsPanel({
  node,
  onClose,
}: GraphNodeDetailsPanelProps) {
  return (
    <div className="absolute top-24 right-10 w-72 p-6 z-10 rounded-xl shadow-xl border border-border bg-popover text-popover-foreground">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        className="absolute top-3 right-3"
      >
        <X size={16} />
      </Button>
      <Badge variant="secondary" className="mb-2">
        {node.group}
      </Badge>
      <h3 className="text-xl font-bold mb-2 text-foreground">{node.label}</h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold text-primary">
          Семестр {node.recommended_semester}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{node.title}</p>
    </div>
  );
}
