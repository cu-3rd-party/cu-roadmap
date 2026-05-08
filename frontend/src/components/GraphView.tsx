import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../consts";
import { Network } from "vis-network";
import { X } from "lucide-react";

export function GraphView() {
  const container = React.useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/graph/data/`).then((res) => {
      const nodes = res.data.nodes.map((n: any) => ({
        ...n,
        shape: "dot",
        size: 20,
        font: { face: "Inter", size: 12, color: "#111" },
        color: {
          background: "#fff",
          border: "#3b82f6",
          highlight: { background: "#eff6ff", border: "#2563eb" },
        },
        borderWidth: 2,
      }));

      const edges = res.data.edges.map((e: any) => ({
        ...e,
        arrows: "to",
        color: { color: "#e5e7eb", highlight: "#3b82f6" },
        font: { align: "middle", color: "#94a3b8", size: 10, face: "Inter" },
        dashes: e.label !== "prerequisite",
      }));

      const network = new Network(
        container.current!,
        { nodes, edges },
        {
          physics: {
            solver: "forceAtlas2Based",
            forceAtlas2Based: {
              gravitationalConstant: -50,
              centralGravity: 0.01,
              springLength: 100,
            },
          },
        },
      );

      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const node = nodes.find((n: any) => n.id === params.nodes[0]);
          setSelectedNode(node);
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
          <p className="text-sm text-gray-500">{selectedNode.title}</p>
        </div>
      )}
    </div>
  );
}
