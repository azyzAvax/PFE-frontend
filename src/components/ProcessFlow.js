import React from "react";
import ReactFlow, { Background, Controls, MiniMap, Panel } from "reactflow";
import "reactflow/dist/style.css";

// Node styles
const nodeStyle = {
  padding: "10px 15px",
  borderRadius: "8px",
  background: "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  fontSize: "14px",
  border: "1px solid #e2e8f0",
  color: "#1e293b",
  fontWeight: 500,
};

const defaultNodes = [
  {
    id: "1",
    position: { x: 50, y: 50 },
    data: { label: "Start Process" },
    type: "input",
    style: {
      ...nodeStyle,
      background: "#e6f7ff",
      border: "1px solid #bae6fd",
    },
  },
];

const defaultEdges = [];

const ProcessFlow = () => {
  return (
    <div
      style={{
        height: 500,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={defaultNodes}
        edges={defaultEdges}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        }}
        fitView
      >
        <Panel position="top-left" style={{ padding: "10px", zIndex: 5 }}>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #e2e8f0",
            }}
          >
            <span>Process Flow</span>
          </div>
        </Panel>

        <Background color="#e2e8f0" gap={20} variant="dots" size={1} />
        <Controls
          style={{
            button: {
              backgroundColor: "#fff",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            },
            wrapper: {
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "8px",
              padding: "4px",
            },
          }}
        />
        <MiniMap
          nodeStrokeColor="#fff"
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default ProcessFlow;
