import type { Edge, Node, Options } from "vis-network";

import type { GraphEdge, GraphNode } from "@/shared/config";

function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export interface VisNetworkConfig {
  nodes: Node[];
  edges: Edge[];
  options: Options;
}

export function buildVisNetworkConfig(
  rawNodes: GraphNode[],
  rawEdges: GraphEdge[],
): VisNetworkConfig {
  const groupOrder = [...new Set(rawNodes.map((n) => n.group))];
  const semesters = [
    ...new Set(rawNodes.map((n) => n.recommended_semester || 1)),
  ].sort((a, b) => a - b);

  const dark = isDarkMode();
  const textColor = dark ? "#ffffff" : "#374151";
  const mutedColor = dark ? "#9ca3af" : "#6b7280";
  const borderColor = "#3b82f6";
  const edgeColor = dark ? "#4b5563" : "#d1d5db";
  const nodeBg = dark ? "#111111" : "#fff";
  const nodeHighlightBg = dark ? "#1e3a5f" : "#eff6ff";

  const semesterLabels: Node[] = semesters.map((s) => ({
    id: `semester-label-${s}`,
    label: `Семестр ${s}`,
    x: (s - 1) * 200,
    y: -100,
    shape: "text",
    font: { face: FONT_FAMILY, size: 16, color: textColor },
  }));

  const groupLabels: Node[] = groupOrder.map((g, i) => ({
    id: `group-label-${g}`,
    label: g,
    x: -80,
    y: i * 140,
    shape: "text",
    font: { face: FONT_FAMILY, size: 14, color: mutedColor },
  }));

  const nodes: Node[] = rawNodes.map((n) => {
    const groupIndex = groupOrder.indexOf(n.group);
    const semester = n.recommended_semester || 1;
    const randomOffset = () => Math.floor(Math.random() * 61) - 30;
    return {
      id: n.id,
      label: "",
      title: `${n.label}\n${n.group}\nСеместр: ${semester}`,
      group: n.group,
      x: (semester - 1) * 200 + randomOffset(),
      y: groupIndex * 140 + randomOffset(),
      shape: "dot",
      size: 28,
      font: {
        face: FONT_FAMILY,
        size: 14,
        color: textColor,
        strokeWidth: 0,
      },
      color: {
        background: nodeBg,
        border: borderColor,
        highlight: { background: nodeHighlightBg, border: borderColor },
      },
      borderWidth: 3,
      shadow: {
        enabled: true,
        color: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)",
        size: 6,
        x: 0,
        y: 3,
      },
    };
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    ...e,
    arrows: "to",
    color: { color: edgeColor, highlight: borderColor },
    font: {
      align: "middle",
      color: mutedColor,
      size: 11,
      face: FONT_FAMILY,
    },
    dashes: e.label !== "prerequisite",
    smooth: { enabled: true, type: "continuous", roundness: 0.5 },
  }));

  return {
    nodes: [...nodes, ...semesterLabels, ...groupLabels],
    edges,
    options: {
      physics: {
        enabled: false,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -80,
          centralGravity: 0.4,
          springLength: 100,
          springConstant: 0.08,
        },
      },
      interaction: { hover: true, tooltipDelay: 100 },
    },
  };
}
