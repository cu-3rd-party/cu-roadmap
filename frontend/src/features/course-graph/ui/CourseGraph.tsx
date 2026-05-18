import { useEffect, useRef } from "react";
import { Network } from "vis-network";

import type { GraphEdge, GraphNode } from "@/shared/config";

import { buildVisNetworkConfig } from "../lib/buildVisNetworkConfig";

interface CourseGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode | null) => void;
}

export function CourseGraph({ nodes, edges, onNodeClick }: CourseGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const config = buildVisNetworkConfig(nodes, edges);
    const network = new Network(
      containerRef.current,
      { nodes: config.nodes, edges: config.edges },
      config.options,
    );

    const fitTimer = setTimeout(() => network.fit({ animation: true }), 500);

    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const rawNode = nodes.find((n) => n.id === params.nodes[0]);
        onNodeClick?.(rawNode ?? null);
      } else {
        onNodeClick?.(null);
      }
    });

    return () => {
      clearTimeout(fitTimer);
      network.destroy();
    };
  }, [nodes, edges, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="flex-1 rounded-2xl min-h-[500px] border border-border bg-muted"
    />
  );
}
