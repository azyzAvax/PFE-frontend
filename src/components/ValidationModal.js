// src/components/modals/ValidationModal.js
import React from "react";

export default function ValidationModal({
  selectedNode,
  validationConfig,
  validationSubprocedures,
  handleValidationProcedureChange,
  updateValidationParameter,
  updateCustomProcedureCall,
  getConnectedInputFields,
}) {
  if (!selectedNode) return null;

  return (
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
        <span style={{ marginRight: "8px", fontSize: "18px" }}>✓</span>
        Validation Configuration
      </h4>

      {/* Procedure Selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
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
            Select Validation Procedure
          </label>
          <select
            value={validationConfig.selectedProcedure}
            onChange={(e) => handleValidationProcedureChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "#fff",
            }}
          >
            <option value="">-- Select a validation procedure --</option>
            {validationSubprocedures.map((proc, index) => (
              <option key={index} value={proc.procedure}>
                {proc.name}
              </option>
            ))}
            <option value="custom">Other validation</option>
          </select>
        </div>

        {/* Parameters */}
        {validationConfig.selectedProcedure &&
          validationConfig.selectedProcedure !== "custom" && (
            <div
              style={{
                background: "#f8fafc",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    color: "#334155",
                  }}
                >
                  Procedure Parameters
                </h5>

                {getConnectedInputFields(selectedNode.id).length > 0 ? (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#10b981",
                      backgroundColor: "#ecfdf5",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10px" }}>✓</span>
                    Input fields available
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#f59e0b",
                      backgroundColor: "#fffbeb",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10px" }}>ℹ️</span>
                    Connect to input node for field selection
                  </div>
                )}
              </div>

              {validationSubprocedures
                .find((p) => p.procedure === validationConfig.selectedProcedure)
                ?.parameters.map((param, index) => {
                  const connectedFields = getConnectedInputFields(
                    selectedNode.id
                  );

                  // Handle column_list (multi-select)
                  if (
                    param.name === "column_list" &&
                    connectedFields &&
                    connectedFields.length > 0
                  ) {
                    const selectedValues = (
                      validationConfig.parameters[param.name] || ""
                    )
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);

                    const toggleField = (field) => {
                      let newValues;
                      if (selectedValues.includes(field)) {
                        newValues = selectedValues.filter(
                          (item) => item !== field
                        );
                      } else {
                        newValues = [...selectedValues, field];
                      }
                      updateValidationParameter(
                        param.name,
                        newValues.join(", ")
                      );
                    };

                    return (
                      <div key={index} style={{ marginBottom: "12px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#334155",
                          }}
                        >
                          {param.name} ({param.type})
                        </label>
                        <div
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "10px",
                            marginBottom: "10px",
                            maxHeight: "150px",
                            overflowY: "auto",
                            backgroundColor: "#fff",
                          }}
                        >
                          {connectedFields.map((field, idx) => (
                            <div key={idx} style={{ marginBottom: "8px" }}>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedValues.includes(field)}
                                  onChange={() => toggleField(field)}
                                  style={{ marginRight: "8px" }}
                                />
                                {field}
                              </label>
                            </div>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={validationConfig.parameters[param.name] || ""}
                          onChange={(e) =>
                            updateValidationParameter(
                              param.name,
                              e.target.value
                            )
                          }
                          placeholder="Selected columns (comma-separated)"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    );
                  }

                  // Regular parameter input
                  return (
                    <div key={index} style={{ marginBottom: "12px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "6px",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        {param.name} ({param.type})
                      </label>
                      <input
                        type="text"
                        value={validationConfig.parameters[param.name] || ""}
                        onChange={(e) =>
                          updateValidationParameter(param.name, e.target.value)
                        }
                        placeholder={`Enter ${param.name}`}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  );
                })}
            </div>
          )}

        {/* Procedure Preview */}
        {validationConfig.selectedProcedure && (
          <div
            style={{
              background: "#f1f5f9",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "monospace",
              color: "#334155",
              overflowX: "auto",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              Procedure Call:
            </div>

            {validationConfig.selectedProcedure === "custom" ? (
              <>
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "12px",
                    color: "#64748b",
                    fontStyle: "italic",
                    fontFamily: "sans-serif",
                  }}
                >
                  Enter your custom validation procedure call below. Example:
                  <br />
                  schema_name.procedure_name(param1 = 'value1', param2 =
                  'value2')
                </div>
                <textarea
                  value={validationConfig.customProcedureCall || ""}
                  onChange={(e) => updateCustomProcedureCall(e.target.value)}
                  placeholder="Enter your custom procedure call here..."
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
              </>
            ) : (
              <code>
                {validationConfig.selectedProcedure}(
                {validationSubprocedures
                  .find(
                    (p) => p.procedure === validationConfig.selectedProcedure
                  )
                  ?.parameters.map(
                    (param) =>
                      `${param.name} => '${
                        validationConfig.parameters[param.name] || ""
                      }'`
                  )
                  .join(", ")}
                )
              </code>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
