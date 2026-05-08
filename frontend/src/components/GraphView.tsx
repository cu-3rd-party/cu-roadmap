import React, {useEffect, useState} from "react";
import axios from "axios";
import {API_BASE} from "../consts";
import {Network} from "vis-network";
import {X} from "lucide-react";

export function GraphView() {
    const container = React.useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    useEffect(() => {
        axios.get(`${API_BASE}/graph/data/`).then(res => {
            const nodes = res.data.nodes.map((n: any) => ({
                ...n,
                shape: 'dot',
                size: 20,
                font: {face: 'Inter', size: 12, color: '#111'},
                color: {
                    background: '#fff',
                    border: '#3b82f6',
                    highlight: {background: '#eff6ff', border: '#2563eb'}
                },
                borderWidth: 2
            }));

            const edges = res.data.edges.map((e: any) => ({
                ...e,
                arrows: 'to',
                color: {color: '#e5e7eb', highlight: '#3b82f6'},
                font: {align: 'middle', color: '#94a3b8', size: 10, face: 'Inter'},
                dashes: e.label !== 'prerequisite'
            }));

            const network = new Network(container.current!, {nodes, edges}, {
                physics: {
                    solver: 'forceAtlas2Based',
                    forceAtlas2Based: {gravitationalConstant: -50, centralGravity: 0.01, springLength: 100}
                }
            });

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
        <div className="view-container full-height-view"
             style={{position: 'relative', display: 'flex', flexDirection: 'column'}}>
            <h1 className="view-title" style={{marginBottom: '20px'}}>Карта связей</h1>
            <div ref={container} className="graph-viz-container"></div>
            {selectedNode && (
                <div className="glass-panel" style={{
                    position: 'absolute', top: '100px', right: '40px', width: '300px',
                    padding: '24px', zIndex: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    <button onClick={() => setSelectedNode(null)} style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}><X size={16}/></button>
                    <span className="badge" style={{marginBottom: '8px'}}>{selectedNode.group}</span>
                    <h3 style={{fontSize: '1.2rem', marginBottom: '8px'}}>{selectedNode.label}</h3>
                    <p className="text-muted" style={{fontSize: '0.9rem'}}>{selectedNode.title}</p>
                </div>
            )}
        </div>
    );
}