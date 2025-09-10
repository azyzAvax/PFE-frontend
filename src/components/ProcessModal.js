// src/components/modals/ProcessModal.js
import React from "react";

export default function ProcessModal({ processConfig, updateProcessConfig }) {
  return (
    <div
      style={{
        background: "#e0f7fa",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #80deea",
      }}
    >
      <h4
        style={{
          margin: "0 0 15px 0",
          fontSize: "16px",
          color: "#006064",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ marginRight: "8px", fontSize: "18px" }}>⚙️</span>
        Process Configuration
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {/* CTE Toggle */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#334155",
            }}
          >
            Use CTE
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={processConfig.useCte || false}
              onChange={(e) =>
                updateProcessConfig({
                  ...processConfig,
                  useCte: e.target.checked,
                })
              }
              style={{ marginRight: "5px" }}
            />
            Enable Common Table Expression
          </label>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "5px",
            }}
          >
            Toggle whether to wrap this process step in a WITH (CTE).
          </div>
        </div>

        {/* Additional SQL */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#334155",
            }}
          >
            Additional Code
          </label>
          <textarea
            value={processConfig.additionalSql || ""}
            onChange={(e) =>
              updateProcessConfig({
                ...processConfig,
                additionalSql: e.target.value,
              })
            }
            placeholder="Enter additional process code here"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              fontFamily: "monospace",
              fontSize: "13px",
              backgroundColor: "#fff",
              color: "#334155",
            }}
          />
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "5px",
            }}
          >
            Enter custom SQL code. If CTE is enabled, this will be wrapped in a
            WITH clause.
          </div>
        </div>
      </div>
    </div>
  );
}
