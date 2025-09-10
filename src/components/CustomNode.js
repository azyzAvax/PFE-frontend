import React from "react";
import { Handle, Position } from "reactflow";

export default function CustomNode({ data }) {
  // Get background color based on node type
  const getNodeTypeStyles = () => {
    const typeColors = {
      input: { bg: "#e6f7ff", border: "#1890ff", icon: "📥" },
      Snowpipe: { bg: "#f6ffed", border: "#52c41a", icon: "❄️" },
      process: { bg: "#fff7e6", border: "#fa8c16", icon: "⚙️" },
      validation: { bg: "#f9f0ff", border: "#722ed1", icon: "✓" },
      merge: { bg: "#fcf4f2", border: "#eb2f96", icon: "🔄" },
      output: { bg: "#f0f5ff", border: "#2f54eb", icon: "📤" },
      aggregation: { bg: "#f0f5ff", border: "#2f54eb", icon: "🔀" },
    };

    return (
      typeColors[data.nodeType] || {
        bg: "#f5f5f5",
        border: "#d9d9d9",
        icon: "📄",
      }
    );
  };

  const nodeStyles = getNodeTypeStyles();

  return (
    <div
      style={{
        padding: "12px 15px",
        border: `2px solid ${nodeStyles.border}`,
        borderRadius: 8,
        background: nodeStyles.bg,
        minWidth: 120,
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        fontSize: 14,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: nodeStyles.border }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 500,
          color: "#333",
        }}
      >
        <span style={{ marginRight: 8, fontSize: 16 }}>{nodeStyles.icon}</span>
        {data.label}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: nodeStyles.border }}
      />
    </div>
  );
}
