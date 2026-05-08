import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../consts";
import { Network } from "vis-network";
import { X } from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  group: string;
  title: string;
  recommended_semester: number;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function GraphView() {
  const container = React.useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    axios.get<GraphData>(`${API_BASE}/graph/data/`).then((res) => {
      const { nodes: rawNodes, edges: rawEdges } = res.data;
      const groupOrder = [...new Set(rawNodes.map((n) => n.group))];

      const nodes = rawNodes.map((n) => {
        const groupIndex = groupOrder.indexOf(n.group);
        const semester = n.recommended_semester || 1;
        const x = (semester - 1) * 200;
        const y = groupIndex * 140;

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
            color: "#1f2937",
            strokeWidth: 0,
          },
          color: {
            background: "#fff",
            border: "#3b82f6",
            highlight: { background: "#eff6ff", border: "#2563eb" },
          },
          borderWidth: 3,
          shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.1)",
            size: 6,
            x: 0,
            y: 3,
          },
        };
      });

      const edges = rawEdges.map((e) => ({
        ...e,
        arrows: "to" as const,
        color: { color: "#d1d5db", highlight: "#3b82f6" },
        font: {
          align: "middle" as const,
          color: "#6b7280",
          size: 11,
          face: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
        dashes: e.label !== "prerequisite",
        smooth: { enabled: true, type: "continuous" as const, roundness: 0.5 },
      }));

      const network = new Network(
        container.current!,
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
    <div
      className="flex flex-col w-full h-full"
      style={{ position: "relative" }}
    >
      <h1 className="text-3xl font-extrabold mb-5 text-gray-900">
        Карта связей
      </h1>
      <div
        ref={container}
        className="flex-1 border border-gray-100 rounded-2xl bg-gray-50 min-h-[500px]"
      ></div>
      {selectedNode && (
        <div
          className="absolute top-24 right-10 w-72 p-6 z-10 rounded-xl shadow-xl bg-white/95 backdrop-blur"
          style={{
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          }}
        >
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-3 right-3 bg-transparent border-none cursor-pointer p-0"
          >
            <X size={16} />
          </button>
          <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold mb-2 inline-block">
            {selectedNode.group}
          </span>
          <h3 className="text-xl font-bold mb-2">{selectedNode.label}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-primary">Семестр {selectedNode.recommended_semester}</span>
          </div>
          <p className="text-sm text-gray-500">{selectedNode.title}</p>
        </div>
      )}
    </div>
  );
}