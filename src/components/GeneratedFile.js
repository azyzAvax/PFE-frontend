import React from "react";

export default function GeneratedFile({ file, handleDownloadFile }) {
  return (
    <div
      style={{
        marginBottom: "1.5rem",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        background: "#fff",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              color: "#64748b",
            }}
          >
            {file.name.endsWith(".sql")
              ? "📜"
              : file.name.endsWith(".py")
              ? "🐍"
              : file.name.endsWith(".json")
              ? "📋"
              : "📄"}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            {file.name}
          </h3>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleDownloadFile(file)}
            style={{
              padding: "8px 12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "14px" }}>⬇️</span>
            Download
          </button>
          <button
            style={{
              padding: "8px 12px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "14px" }}>🚀</span>
            Deploy
          </button>
        </div>
      </div>
      <pre
        style={{
          backgroundColor: "#1e293b",
          padding: "1.25rem",
          margin: 0,
          overflowX: "auto",
          color: "#e2e8f0",
          fontSize: "14px",
          lineHeight: 1.6,
          borderRadius: "0 0 10px 10px",
        }}
      >
        <code>{file.content}</code>
      </pre>
    </div>
  );
}
