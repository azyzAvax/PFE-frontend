export default function MergeConfigModal({
  mergeConfig,
  setMergeConfig,
  selectedNode,
  availableFields,
  processId,
  procedureName,
  sourceQueryTemplate,
  customValues,
  addJoinCondition,
  updateJoinCondition,
  removeJoinCondition,
  handleMergeChange,
  handleToggleField,
  handleCustomValueChange,
  generateMergeQuery,
  saveMergeConfig,
  setIsModalOpen,
}) {
  return (
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
        <span style={{ marginRight: "8px", fontSize: "18px" }}>🔄</span>
        Merge Configuration
      </h4>
      <div style={{ display: "grid", gap: 15 }}>
        {/* Target Table */}
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
            Target Table
          </label>
          <input
            name="targetTable"
            value={mergeConfig.targetTable}
            onChange={handleMergeChange}
            placeholder="e.g., rfz_ope_and_mte.dm_m_cams_coal_ash_ship_dist"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
        </div>
        {/* Source Table */}
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
            Source Table
          </label>
          <input
            name="sourceTable"
            value={mergeConfig.sourceTable}
            onChange={handleMergeChange}
            placeholder="e.g., trz_ope_and_mte.str_od_m_cams_coal_ash_ship_dist_01"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
        </div>
        {/* Source Query */}
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
            Source Query
          </label>
          <textarea
            name="sourceQuery"
            value={mergeConfig.sourceQuery || sourceQueryTemplate}
            onChange={handleMergeChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              minHeight: "100px",
            }}
          />
          <label
            style={{
              marginTop: "5px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <input
              type="checkbox"
              checked={mergeConfig.useCte}
              onChange={(e) =>
                setMergeConfig((prev) => ({
                  ...prev,
                  useCte: e.target.checked,
                }))
              }
            />{" "}
            Use CTE
          </label>
        </div>
        {/* Join Conditions */}
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
            Join Conditions
          </label>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "10px",
              maxHeight: "250px", // Increased height to accommodate WHERE
              overflowY: "auto",
              backgroundColor: "#fff",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={mergeConfig.useJoin || false}
                  onChange={(e) =>
                    setMergeConfig((prev) => ({
                      ...prev,
                      useJoin: e.target.checked,
                    }))
                  }
                  style={{ marginRight: "5px" }}
                />
                Include Join Conditions
              </label>
            </div>

            {mergeConfig.useJoin && (
              <div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#334155",
                    }}
                  >
                    Join Type
                  </label>
                  <select
                    value={mergeConfig.joinType || "INNER"}
                    onChange={(e) =>
                      setMergeConfig((prev) => ({
                        ...prev,
                        joinType: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  >
                    <option value="INNER">INNER</option>
                    <option value="LEFT">LEFT</option>
                    <option value="RIGHT">RIGHT</option>
                    <option value="FULL">FULL</option>
                  </select>
                </div>

                {mergeConfig.joinConditions.map((cond, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    {index === 0 && (
                      <span style={{ alignSelf: "center" }}>ON</span>
                    )}
                    <select
                      value={cond.field}
                      onChange={(e) =>
                        updateJoinCondition(index, "field", e.target.value)
                      }
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        flex: 1,
                      }}
                    >
                      <option value="">-- Select Field --</option>
                      {availableFields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={(e) =>
                        updateJoinCondition(index, "operator", e.target.value)
                      }
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">{">"}</option>
                      <option value="<">{"<"}</option>
                    </select>
                    <input
                      value={cond.value}
                      onChange={(e) =>
                        updateJoinCondition(index, "value", e.target.value)
                      }
                      placeholder="Value or Field"
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        flex: 1,
                      }}
                    />
                    {index > 0 && (
                      <select
                        value={cond.connector}
                        onChange={(e) =>
                          updateJoinCondition(
                            index,
                            "connector",
                            e.target.value
                          )
                        }
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <button
                      onClick={() => removeJoinCondition(index)}
                      style={{
                        padding: "8px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addJoinCondition}
                  style={{
                    padding: "8px 12px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    marginTop: "5px",
                  }}
                >
                  Add Condition
                </button>
              </div>
            )}

            <div style={{ marginTop: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#334155",
                }}
              >
                WHERE Clause (Optional)
              </label>
              <textarea
                value={mergeConfig.whereClause || ""}
                onChange={(e) =>
                  setMergeConfig((prev) => ({
                    ...prev,
                    whereClause: e.target.value,
                  }))
                }
                placeholder="Enter WHERE clause (e.g., LENGTH(kks_ext_code) = 3 AND system_status_class = 'ACTIVE')"
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "10px",
                  borderRadius: "6px",
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
                Optional: Add custom WHERE conditions for the source query.
              </div>
            </div>
          </div>
        </div>
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
            WHEN MATCHED Updates
          </label>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "10px",
              maxHeight: "150px",
              overflowY: "auto",
              backgroundColor: "#fff",
            }}
          >
            {availableFields.length > 0 ? (
              <>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={
                      availableFields.every((field) =>
                        mergeConfig.matchedUpdates.includes(field)
                      ) &&
                      mergeConfig.matchedUpdates.includes("update_at") &&
                      mergeConfig.matchedUpdates.includes("process_id")
                    }
                    onChange={(e) => {
                      const allFields = [
                        ...availableFields,
                        "update_at",
                        "process_id",
                      ];
                      setMergeConfig((prev) => ({
                        ...prev,
                        matchedUpdates: e.target.checked ? allFields : [],
                      }));
                    }}
                  />{" "}
                  Select All
                </label>
                {availableFields.map((field, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={mergeConfig.matchedUpdates.includes(field)}
                      onChange={() =>
                        handleToggleField("matchedUpdates", field)
                      }
                    />{" "}
                    <span>
                      target.{field} = source.{field}
                    </span>
                    <input
                      value={customValues.matchedUpdates[field] || ""}
                      onChange={(e) =>
                        handleCustomValueChange(
                          "matchedUpdates",
                          field,
                          e.target.value
                        )
                      }
                      placeholder="Custom Value"
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        flex: 1,
                      }}
                    />
                  </div>
                ))}
                <div
                  style={{
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={mergeConfig.matchedUpdates.includes("update_at")}
                    onChange={() =>
                      handleToggleField("matchedUpdates", "update_at")
                    }
                  />{" "}
                  <span>update_at = CURRENT_TIMESTAMP()</span>
                  <input
                    value={customValues.matchedUpdates["update_at"] || ""}
                    onChange={(e) =>
                      handleCustomValueChange(
                        "matchedUpdates",
                        "update_at",
                        e.target.value
                      )
                    }
                    placeholder="Custom Value"
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      flex: 1,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={mergeConfig.matchedUpdates.includes("process_id")}
                    onChange={() =>
                      handleToggleField("matchedUpdates", "process_id")
                    }
                  />{" "}
                  <span>process_id = '{processId}'</span>
                  <input
                    value={customValues.matchedUpdates["process_id"] || ""}
                    onChange={(e) =>
                      handleCustomValueChange(
                        "matchedUpdates",
                        "process_id",
                        e.target.value
                      )
                    }
                    placeholder="Custom Value"
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      flex: 1,
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ color: "#ef4444", fontSize: "12px" }}>
                No fields available. Connect an input node to enable field
                selection.
              </div>
            )}
          </div>
        </div>
        {/* WHEN NOT MATCHED Inserts */}
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
            WHEN NOT MATCHED Inserts
          </label>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "10px",
              maxHeight: "150px",
              overflowY: "auto",
              backgroundColor: "#fff",
            }}
          >
            {availableFields.length > 0 ? (
              <>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={
                      availableFields.every((field) =>
                        mergeConfig.notMatchedInserts.includes(field)
                      ) &&
                      mergeConfig.notMatchedInserts.includes("create_at") &&
                      mergeConfig.notMatchedInserts.includes("process_at") &&
                      mergeConfig.notMatchedInserts.includes("process_id")
                    }
                    onChange={(e) => {
                      const allFields = [
                        ...availableFields,
                        "create_at",
                        "process_at",
                        "process_id",
                      ];
                      setMergeConfig((prev) => ({
                        ...prev,
                        notMatchedInserts: e.target.checked ? allFields : [],
                      }));
                    }}
                  />{" "}
                  Select All
                </label>
                {availableFields.map((field, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={mergeConfig.notMatchedInserts.includes(field)}
                      onChange={() =>
                        handleToggleField("notMatchedInserts", field)
                      }
                    />{" "}
                    <span>{field}</span>
                    <input
                      value={customValues.notMatchedInserts[field] || ""}
                      onChange={(e) =>
                        handleCustomValueChange(
                          "notMatchedInserts",
                          field,
                          e.target.value
                        )
                      }
                      placeholder="Custom Value"
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        flex: 1,
                      }}
                    />
                  </div>
                ))}
                <div
                  style={{
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={mergeConfig.notMatchedInserts.includes(
                      "create_at"
                    )}
                    onChange={() =>
                      handleToggleField("notMatchedInserts", "create_at")
                    }
                  />{" "}
                  <span>create_at = CURRENT_TIMESTAMP()</span>
                  <input
                    value={customValues.notMatchedInserts["create_at"] || ""}
                    onChange={(e) =>
                      handleCustomValueChange(
                        "notMatchedInserts",
                        "create_at",
                        e.target.value
                      )
                    }
                    placeholder="Custom Value"
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      flex: 1,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={mergeConfig.notMatchedInserts.includes(
                      "process_at"
                    )}
                    onChange={() =>
                      handleToggleField("notMatchedInserts", "process_at")
                    }
                  />{" "}
                  <span>process_at = CURRENT_TIMESTAMP()</span>
                  <input
                    value={customValues.notMatchedInserts["process_at"] || ""}
                    onChange={(e) =>
                      handleCustomValueChange(
                        "notMatchedInserts",
                        "process_at",
                        e.target.value
                      )
                    }
                    placeholder="Custom Value"
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      flex: 1,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={mergeConfig.notMatchedInserts.includes(
                      "process_id"
                    )}
                    onChange={() =>
                      handleToggleField("notMatchedInserts", "process_id")
                    }
                  />{" "}
                  <span>process_id = '{processId}'</span>
                  <input
                    value={customValues.notMatchedInserts["process_id"] || ""}
                    onChange={(e) =>
                      handleCustomValueChange(
                        "notMatchedInserts",
                        "process_id",
                        e.target.value
                      )
                    }
                    placeholder="Custom Value"
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      flex: 1,
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ color: "#ef4444", fontSize: "12px" }}>
                No fields available. Connect an input node to enable field
                selection.
              </div>
            )}
          </div>
        </div>
        {/* Preview Merge Query */}
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
            Preview Merge Query
          </label>
          <textarea
            value={generateMergeQuery()}
            readOnly
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              minHeight: "150px",
              background: "#f1f5f9",
            }}
          />
        </div>
        {/* Save/Cancel Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={saveMergeConfig}
            style={{
              padding: "10px 20px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Save
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{
              padding: "10px 20px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
