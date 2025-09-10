import React from "react";

const MergeConfigSection = ({
  mergeConfig,
  setMergeConfig,
  selectedNode,
  handleMergeChange,
  updateJoinCondition,
  removeJoinCondition,
  addJoinCondition,
  handleToggleField,
  handleCustomValueChange,
  customValues,
  generateMergeQuery,
  saveMergeConfig,
  setIsModalOpen,
  getConnectedInputFields,
}) => {
  const availableFields = getConnectedInputFields(selectedNode.id) || [];

  const processId = mergeConfig.targetTable
    ? `proc_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}_v1`
    : "";

  const sourceQueryTemplate = mergeConfig.useCte
    ? `WITH temp1 AS (SELECT ${
        availableFields.length > 0 ? availableFields.join(", ") : "*"
      } FROM ${
        mergeConfig.sourceTable || "<sourceTable>"
      } WHERE METADATA$ACTION = 'INSERT') 
       SELECT * FROM temp1`
    : `SELECT ${
        availableFields.length > 0 ? availableFields.join(", ") : "*"
      } FROM ${mergeConfig.sourceTable || "<sourceTable>"}`;

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
          <label className="merge-label">Target Table</label>
          <input
            name="targetTable"
            value={mergeConfig.targetTable}
            onChange={handleMergeChange}
            placeholder="e.g., rfz_ope_and_mte.dm_m_cams_coal_ash_ship_dist"
            className="merge-input"
          />
        </div>

        {/* Source Table */}
        <div>
          <label className="merge-label">Source Table</label>
          <input
            name="sourceTable"
            value={mergeConfig.sourceTable}
            onChange={handleMergeChange}
            placeholder="e.g., trz_ope_and_mte.str_od_m_cams_coal_ash_ship_dist_01"
            className="merge-input"
          />
        </div>

        {/* Source Query */}
        <div>
          <label className="merge-label">Source Query</label>
          <textarea
            name="sourceQuery"
            value={mergeConfig.sourceQuery || sourceQueryTemplate}
            onChange={handleMergeChange}
            className="merge-textarea"
            style={{ minHeight: "100px" }}
          />
          <label className="merge-sub-label">
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
        {/* ... keep all your join condition JSX here but wrapped in this component */}

        {/* WHEN MATCHED Updates */}
        {/* ... keep matched updates section */}

        {/* WHEN NOT MATCHED Inserts */}
        {/* ... keep not matched inserts section */}

        {/* Preview Merge Query */}
        <div>
          <label className="merge-label">Preview Merge Query</label>
          <textarea
            value={generateMergeQuery()}
            readOnly
            className="merge-textarea"
            style={{ minHeight: "150px", background: "#f1f5f9" }}
          />
        </div>

        {/* Save/Cancel Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={saveMergeConfig} className="merge-btn save">
            Save
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            className="merge-btn cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeConfigSection;
