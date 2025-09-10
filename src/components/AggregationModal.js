import React from "react";

export default function AggregationModal({ selectedNode, setNodes }) {
  if (!selectedNode) return null;

  return (
    <div
      style={{
        background: "#fefce8",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #fde68a",
      }}
    >
      <h4
        style={{
          margin: 0,
          fontSize: "16px",
          color: "#92400e",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ marginRight: "8px", fontSize: "18px" }}>📊</span>
        Aggregation Node
      </h4>

      <p
        style={{
          fontSize: "14px",
          color: "#78350f",
          marginTop: "10px",
          lineHeight: 1.4,
        }}
      >
        This node collects multiple inputs and produces a single consolidated
        output. Connect any number of nodes into this Aggregator — only one
        output edge will be available.
      </p>

      <label style={{ fontSize: "14px", fontWeight: 500, color: "#444" }}>
        Number of Input Slots
      </label>
      <input
        type="number"
        min="1"
        max="10"
        value={selectedNode.data.inputs || 3}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          setNodes((nds) =>
            nds.map((node) =>
              node.id === selectedNode.id
                ? {
                    ...node,
                    data: { ...node.data, inputs: value },
                  }
                : node
            )
          );
        }}
        style={{
          marginTop: "8px",
          padding: "8px",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          width: "100%",
          fontSize: "14px",
        }}
      />
    </div>
  );
}
