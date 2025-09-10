import React from "react";

function InputConfigModal({
  setInputCells,
  inputType,
  setInputType,
  handleHeaderUpload,
  tableInfo,
  inputCells,
  addInputCell,
  deleteInputCell,
  updateInputCell,
  clearAllInputCells,
}) {
  return (
    <>
      {/* Upload Section */}
      <div
        style={{
          background: "#f0f9ff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #bae6fd",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: "8px", fontSize: "18px" }}>📤</span>
            Upload {inputType === "csv" ? "Headers" : "DDL"}
          </h4>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: "#e2e8f0",
                borderRadius: "20px",
                padding: "3px",
              }}
            >
              <button
                onClick={() => setInputType("csv")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "16px",
                  border: "none",
                  background: inputType === "csv" ? "#0369a1" : "transparent",
                  color: inputType === "csv" ? "white" : "#64748b",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                CSV/Excel
              </button>
              <button
                onClick={() => setInputType("ddl")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "16px",
                  border: "none",
                  background: inputType === "ddl" ? "#0369a1" : "transparent",
                  color: inputType === "ddl" ? "white" : "#64748b",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                DDL
              </button>
            </div>
          </div>
        </div>

        <label
          htmlFor="file-upload"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #bae6fd",
            borderRadius: "8px",
            padding: "30px 20px",
            cursor: "pointer",
            backgroundColor: "#f0f9ff",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "32px", marginBottom: "15px" }}>📂</span>
          <span
            style={{
              fontWeight: 500,
              marginBottom: "5px",
              color: "#0369a1",
            }}
          >
            Click to upload a file
          </span>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            or drag and drop a {inputType === "csv" ? "CSV/Excel" : "SQL DDL"}{" "}
            file
          </span>
          <input
            id="file-upload"
            type="file"
            accept={inputType === "csv" ? ".csv,.xlsx,.xls" : ".sql"}
            onChange={handleHeaderUpload}
            style={{
              display: "none",
            }}
          />
        </label>
      </div>

      {inputType === "ddl" && tableInfo.tableName && (
        <div
          style={{
            background: "#f0f9ff",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #bae6fd",
          }}
        >
          <h4
            style={{
              margin: "0 0 15px 0",
              fontSize: "16px",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: "8px", fontSize: "18px" }}>📊</span>
            Table Information
          </h4>

          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                Schema:
              </div>
              <div
                style={{
                  flex: 2,
                  color: "#0369a1",
                  fontFamily: "monospace",
                }}
              >
                {tableInfo.schema}
              </div>
            </div>
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                Table Name:
              </div>
              <div
                style={{
                  flex: 2,
                  color: "#0369a1",
                  fontFamily: "monospace",
                }}
              >
                {tableInfo.tableName}
              </div>
            </div>
            {tableInfo.tableComment && (
              <div style={{ display: "flex", marginBottom: "10px" }}>
                <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                  Description:
                </div>
                <div style={{ flex: 2, color: "#334155" }}>
                  {tableInfo.tableComment}
                </div>
              </div>
            )}
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                Fields:
              </div>
              <div style={{ flex: 2, color: "#334155" }}>
                {tableInfo.fields.length} fields extracted
              </div>
            </div>
            {tableInfo.primaryKeys && tableInfo.primaryKeys.length > 0 && (
              <div style={{ display: "flex", marginBottom: "10px" }}>
                <div
                  style={{
                    flex: 1,
                    fontWeight: "500",
                    color: "#334155",
                  }}
                >
                  Primary Key:
                </div>
                <div style={{ flex: 2, color: "#334155" }}>
                  {tableInfo.primaryKeys[0].columns.join(", ")}
                </div>
              </div>
            )}
            {tableInfo.foreignKeys && tableInfo.foreignKeys.length > 0 && (
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    flex: 1,
                    fontWeight: "500",
                    color: "#334155",
                  }}
                >
                  Foreign Keys:
                </div>
                <div style={{ flex: 2, color: "#334155" }}>
                  {tableInfo.foreignKeys.length} foreign keys found
                </div>
              </div>
            )}
          </div>

          {tableInfo.foreignKeys && tableInfo.foreignKeys.length > 0 && (
            <div>
              <h5
                style={{
                  margin: "15px 0 10px",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                Foreign Key Relationships:
              </h5>
              <div
                style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  background: "#f8fafc",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {tableInfo.foreignKeys.map((fk, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "8px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  >
                    <div style={{ color: "#0369a1" }}>
                      {fk.columns.join(", ")} → {fk.referenceSchema}.
                      {fk.referenceTable}({fk.referenceColumns.join(", ")})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 15 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: "8px", fontSize: "18px" }}>📋</span>
            Input Fields {inputType === "ddl" && "(Extracted from DDL)"}
          </h4>
          <div style={{ display: "flex", gap: 8 }}>
            {inputType === "csv" && (
              <>
                <button
                  onClick={addInputCell}
                  style={{
                    padding: "8px 12px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>+</span>
                  Add Field
                </button>
                <button
                  onClick={clearAllInputCells}
                  style={{
                    padding: "8px 12px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {inputType === "ddl" && tableInfo.fields.length > 0
            ? // Display fields with types for DDL mode
              tableInfo.fields.map((field, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <span
                    style={{
                      marginRight: "8px",
                      color: "#64748b",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}:
                  </span>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "500" }}>{field.name}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontFamily: "monospace",
                      }}
                    >
                      {field.type} {field.notNull && "NOT NULL"}
                    </span>
                  </div>

                  {field.comment && (
                    <span
                      title={field.comment}
                      style={{
                        marginLeft: "8px",
                        color: "#94a3b8",
                        cursor: "help",
                        fontSize: "14px",
                      }}
                    >
                      ℹ️
                    </span>
                  )}
                </div>
              ))
            : // Regular input cells for CSV mode
              inputCells.map((cell, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "4px 4px 4px 12px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <span
                    style={{
                      marginRight: "8px",
                      color: "#64748b",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}:
                  </span>

                  <input
                    value={cell}
                    onChange={(e) => updateInputCell(index, e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("Text");
                      const pastedCells = pasted
                        .split("\t")
                        .map((val) => val.trim())
                        .filter(Boolean);
                      if (pastedCells.length > 1) {
                        e.preventDefault();
                        const updated = [...inputCells];
                        updated.splice(index, 1, ...pastedCells);
                        setInputCells(updated);
                      }
                    }}
                    placeholder={`Column ${index + 1}`}
                    style={{
                      padding: "8px",
                      minWidth: "150px",
                      border: "none",
                      borderRadius: "4px",
                      outline: "none",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    onClick={() => deleteInputCell(index)}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: "14px",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
          {(inputType === "csv" && inputCells.length === 0) ||
          (inputType === "ddl" && tableInfo.fields.length === 0) ? (
            <div
              style={{
                padding: 25,
                color: "#94a3b8",
                width: "100%",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
                borderRadius: "6px",
                background: "#fff",
              }}
            >
              {inputType === "csv"
                ? "No fields added yet. Upload a CSV/Excel file or add fields manually."
                : "No fields found. Please upload a valid DDL file."}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          fontSize: 13,
          color: "#64748b",
          background: "#f1f5f9",
          padding: "12px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "16px" }}>💡</span>
        <span>
          Tip: You can paste tab-separated values into any field to create
          multiple fields at once.
        </span>
      </div>
    </>
  );
}

export default InputConfigModal;
