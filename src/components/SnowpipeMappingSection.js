import React from "react";

const SnowpipeMappingSection = ({
  snowpipeConfig,
  setSnowpipeConfig,
  mappingRules,
  setMappingRules,
  selectedNode,
  addMappingRule,
  deleteMappingRule,
}) => {
  const autoMapFields = () => {
    const fields = selectedNode?.data?.inputCells || [];
    const autoMapped = fields.map((field) => ({
      input_Name: field,
      output_Name: field,
    }));
    setMappingRules(autoMapped);
  };

  const addMetadataFields = () => {
    const metadataFields = [
      { input_Name: "METADATA$FILENAME", output_Name: "file_name" },
      { input_Name: "METADATA$FILE_ROW_NUMBER", output_Name: "row_number" },
      { input_Name: "CURRENT_TIMESTAMP()", output_Name: "created_at" },
      {
        input_Name: "TO_TIMESTAMP_LTZ(METADATA$FILE_LAST_MODIFIED)",
        output_Name: "process_at",
      },
      {
        input_Name: snowpipeConfig.process_id || "process_id",
        output_Name: "process_id",
      },
    ];

    setMappingRules([...mappingRules, ...metadataFields]);
  };

  return (
    <>
      {/* Snowpipe Config Section */}
      <div
        style={{
          background: "#f8fafc",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "25px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h4
          style={{
            margin: "0 0 15px 0",
            fontSize: "16px",
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginRight: "8px", fontSize: "18px" }}>❄️</span>
          Snowpipe Configuration
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 15,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Process ID",
              key: "process_id",
              placeholder: "pip_dl_m_name",
            },
            {
              label: "Output Table Name",
              key: "output_table_name",
              placeholder: "dl_m_table_name",
            },
            { label: "Zone", key: "output_table_zone", placeholder: "DLZ" },
            {
              label: "File Format",
              key: "file_format",
              placeholder: "fmt_csv_01",
            },
            { label: "Pattern Type", key: "pattern_type", placeholder: "csv" },
            {
              label: "Stage Name",
              key: "stage_name",
              placeholder: "dlz.stg_name",
            },
          ].map((field) => (
            <div key={field.key}>
              <label
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontWeight: 500,
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                {field.label}
              </label>
              <input
                value={snowpipeConfig[field.key]}
                onChange={(e) =>
                  setSnowpipeConfig({
                    ...snowpipeConfig,
                    [field.key]: e.target.value,
                  })
                }
                placeholder={field.placeholder}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Field Mapping Section */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 15,
            alignItems: "center",
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
            <span style={{ marginRight: "8px", fontSize: "18px" }}>🔄</span>
            Field Mapping
          </h4>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={autoMapFields}
              style={{
                padding: "8px 12px",
                background: "#3b82f6",
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
              <span style={{ fontSize: "14px" }}>⚡</span>
              Auto Map Fields
            </button>
            <button
              onClick={addMetadataFields}
              style={{
                padding: "8px 12px",
                background: "#8b5cf6",
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
              Add Metadata
            </button>
            <button
              onClick={addMappingRule}
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
              Add Mapping
            </button>
          </div>
        </div>

        {/* Mapping Rules Table */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: 15,
            maxHeight: "350px",
            overflowY: "auto",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontWeight: 600,
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: 12,
              marginBottom: 15,
              fontSize: "14px",
              color: "#475569",
            }}
          >
            <div>Input Field</div>
            <div>Output Field</div>
          </div>

          {mappingRules.map((rule, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                alignItems: "center",
                marginBottom: 12,
                padding: "8px",
                background: index % 2 === 0 ? "#f8fafc" : "#fff",
                borderRadius: "6px",
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  placeholder="Input field or expression"
                  value={rule.input_Name}
                  onChange={(e) => {
                    const updated = [...mappingRules];
                    updated[index].input_Name = e.target.value;
                    setMappingRules(updated);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
                <span
                  style={{
                    margin: "0 12px",
                    fontSize: 18,
                    color: "#3b82f6",
                  }}
                >
                  →
                </span>
              </div>

              <div style={{ display: "flex" }}>
                <input
                  placeholder="Output column name"
                  value={rule.output_Name}
                  onChange={(e) => {
                    const updated = [...mappingRules];
                    updated[index].output_Name = e.target.value;
                    setMappingRules(updated);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
                <button
                  onClick={() => deleteMappingRule(index)}
                  style={{
                    marginLeft: 8,
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {mappingRules.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px dashed #cbd5e1",
                fontSize: "14px",
              }}
            >
              <span>
                No mappings defined. Click "Auto Map Fields" or add mappings
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SnowpipeMappingSection;
