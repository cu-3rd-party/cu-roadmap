import { useState } from "react";

import {
  CourseGraph,
  GraphNodeDetailsPanel,
  useGraphDataQuery,
} from "@/features/course-graph";
import type { GraphNode } from "@/shared/config";

export const GraphPage = () => {
  const { data } = useGraphDataQuery();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="flex flex-col w-full h-full relative">
      <h1 className="text-3xl font-extrabold mb-5 text-foreground">
        Карта связей
      </h1>
      <CourseGraph
        nodes={data?.nodes ?? []}
        edges={data?.edges ?? []}
        onNodeClick={setSelectedNode}
      />
      {selectedNode && (
        <GraphNodeDetailsPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default GraphPage;
