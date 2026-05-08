import React, { useEffect, useState, useRef } from "react";
import { Network } from "vis-network";
import { X } from "lucide-react";
import { api } from "@/shared/config";
import type { GraphNode } from "@/shared/config";

function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    api.getGraphData().then((res) => {
      const { nodes: rawNodes, edges: rawEdges } = res.data;
      const groupOrder = [...new Set(rawNodes.map((n) => n.group))];
      const semesters = [...new Set(rawNodes.map((n) => n.recommended_semester || 1))].sort((a, b) => a - b);

      const dark = isDarkMode();
      const textColor = dark ? "#ffffff" : "#374151";
      const mutedColor = dark ? "#9ca3af" : "#6b7280";
      const borderColor = dark ? "#3b82f6" : "#3b82f6";
      const edgeColor = dark ? "#4b5563" : "#d1d5db";
      const nodeBg = dark ? "#111111" : "#fff";
      const nodeHighlightBg = dark ? "#1e3a5f" : "#eff6ff";

      const semesterLabels = semesters.map((s) => ({
        id: `semester-label-${s}`,
        label: `Семестр ${s}`,
        x: (s - 1) * 200,
        y: -100,
        shape: "text" as const,
        font: {
          face: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          size: 16,
          color: textColor,
        },
      }));

      const groupLabels = groupOrder.map((g, i) => ({
        id: `group-label-${g}`,
        label: g,
        x: -80,
        y: i * 140,
        shape: "text" as const,
        font: {
          face: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          size: 14,
          color: mutedColor,
        },
      }));

      const nodes = rawNodes.map((n) => {
        const groupIndex = groupOrder.indexOf(n.group);
        const semester = n.recommended_semester || 1;
        const randomOffset = () => Math.floor(Math.random() * 61) - 30;
        const x = (semester - 1) * 200 + randomOffset();
        const y = groupIndex * 140 + randomOffset();

        return {
          id: n.id,
          label: "",
          title: `${n.label}\n${n.group}\nСеместр: ${semester}`,
          group: n.group,
          x,
          y,
          shape: "dot" as const,
          size: 28,
          font: {
            face: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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

      nodes.push(
        ...(semesterLabels as unknown as typeof nodes),
        ...(groupLabels as unknown as typeof nodes),
      );

      const edges = rawEdges.map((e) => ({
        ...e,
        arrows: "to" as const,
        color: { color: edgeColor, highlight: borderColor },
        font: {
          align: "middle" as const,
          color: mutedColor,
          size: 11,
          face: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
        dashes: e.label !== "prerequisite",
        smooth: { enabled: true, type: "continuous" as const, roundness: 0.5 },
      }));

      const network = new Network(
        containerRef.current!,
        { nodes, edges },
        {
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
      );

      setTimeout(() => network.fit({ animation: true }), 500);

      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const rawNode = rawNodes.find((n) => n.id === params.nodes[0]);
          if (rawNode) setSelectedNode(rawNode);
        } else {
          setSelectedNode(null);
        }
      });
    });
  }, []);

  return (
    <div className="flex flex-col w-full h-full" style={{ position: "relative" }}>
      <h1 className="text-3xl font-extrabold mb-5" style={{ color: "var(--color-text-main)" }}>
        Карта связей
      </h1>
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl min-h-[500px]"
        style={{
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-hover)",
        }}
      ></div>
      {selectedNode && (
        <div
          className="absolute top-24 right-10 w-72 p-6 z-10 rounded-xl shadow-xl"
          style={{
            backgroundColor: "var(--color-bg-main)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "var(--color-border)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-3 right-3 border-none cursor-pointer p-0 bg-transparent"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={16} />
          </button>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-bold mb-2 inline-block"
            style={{
              backgroundColor: "var(--color-bg-hover)",
              color: "var(--color-text-muted)",
            }}
          >
            {selectedNode.group}
          </span>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-main)" }}>
            {selectedNode.label}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
              Семестр {selectedNode.recommended_semester}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {selectedNode.title}
          </p>
        </div>
      )}
    </div>
  );
}
