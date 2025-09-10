import React from "react";

const FileUploadSection = ({
  inputType,
  setInputType,
  tableInfo,
  handleHeaderUpload,
  inputCells,
  setInputCells,
  addInputCell,
  deleteInputCell,
  clearAllInputCells,
  updateInputCell,
}) => {
  return (
    <>
      <div
        style={{
          background: "#f0f9ff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #bae6fd",
        }}
      >
        {/* Upload Header / DDL */}
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
            style={{ fontWeight: 500, marginBottom: "5px", color: "#0369a1" }}
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
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Table Info */}
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
                style={{ flex: 2, color: "#0369a1", fontFamily: "monospace" }}
              >
                {tableInfo.schema}
              </div>
            </div>
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                Table Name:
              </div>
              <div
                style={{ flex: 2, color: "#0369a1", fontFamily: "monospace" }}
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
                <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                  Primary Key:
                </div>
                <div style={{ flex: 2, color: "#334155" }}>
                  {tableInfo.primaryKeys[0].columns.join(", ")}
                </div>
              </div>
            )}
            {tableInfo.foreignKeys && tableInfo.foreignKeys.length > 0 && (
              <div style={{ display: "flex" }}>
                <div style={{ flex: 1, fontWeight: "500", color: "#334155" }}>
                  Foreign Keys:
                </div>
                <div style={{ flex: 2, color: "#334155" }}>
                  {tableInfo.foreignKeys.length} foreign keys found
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploadSection;
