import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import * as XLSX from "xlsx";
import AggregationModal from "../components/AggregationModal";
import CustomNode from "../components/CustomNode";
import InputConfigModal from "../components/InputConfigModal";
import MergeConfigModal from "../components/MergeConfigModal";
import SnowpipeMappingSection from "../components/SnowpipeMappingSection";

import ProcessModal from "../components/ProcessModal";
import ValidationModal from "../components/ValidationModal";

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  const debouncedFn = useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFn;
}
const nodeTypes = {
  default: CustomNode,
};

const toolboxItems = [
  { type: "input", label: "Input", icon: "📥" },
  { type: "Snowpipe", label: "Snowpipe", icon: "❄️" },
  { type: "process", label: "Process", icon: "⚙️" },
  { type: "validation", label: "Validation", icon: "✓" },
  { type: "merge", label: "Merge", icon: "🔄" },
  { type: "output", label: "Output", icon: "📤" },
  { type: "aggregation", label: "Aggregator", icon: "🔀" },
];

// List of validation subprocedures with their parameters
const validationSubprocedures = [
  {
    name: "Date Consistency Validation",
    procedure: "usp_sub_date_consistency_validation",
    parameters: [
      {
        name: "master_table",
        type: "VARCHAR",
        description: "Master table name",
      },
      {
        name: "master_table_schema",
        type: "VARCHAR",
        description: "Schema of the master table",
      },
      {
        name: "master_id",
        type: "VARCHAR",
        description: "ID column in the master table",
      },
      { name: "process_id", type: "VARCHAR", description: "Process ID" },
      {
        name: "process_schema",
        type: "VARCHAR",
        description: "Schema of the process",
      },
    ],
  },
  {
    name: "Data Type Validation",
    procedure: "usp_sub_data_type_validation",
    parameters: [
      { name: "table_name", type: "VARCHAR", description: "Table to validate" },
      {
        name: "schema_name",
        type: "VARCHAR",
        description: "Schema of the table",
      },
      {
        name: "column_name",
        type: "VARCHAR",
        description: "Column to validate",
      },
      {
        name: "expected_type",
        type: "VARCHAR",
        description: "Expected data type",
      },
    ],
  },
  {
    name: "Null Check Validation",
    procedure: "usp_sub_null_check_validation",
    parameters: [
      { name: "table_name", type: "VARCHAR", description: "Table to validate" },
      {
        name: "schema_name",
        type: "VARCHAR",
        description: "Schema of the table",
      },
      {
        name: "column_list",
        type: "VARCHAR",
        description: "Comma-separated list of columns to check",
      },
    ],
  },
];

const initialNodes = [];
const initialEdges = [];

function FlowCanvas({ onCodeGenerated, objectType }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // eslint-disable-next-line no-undef
  useEffect(() => {
    console.log("Updated Nodes:", nodes);
  }, [nodes]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCells, setInputCells] = useState([]);
  const [mappingRules, setMappingRules] = useState([]);
  const [inputFieldMap, setInputFieldMap] = useState({});
  const [aggregationFields, setAggregationFields] = useState([]);
  const [groupByFields, setGroupByFields] = useState([]);
  const [inputType, setInputType] = useState("csv");
  const [tableInfo, setTableInfo] = useState({
    schema: "",
    tableName: "",
    tableComment: "",
    fields: [],
    foreignKeys: [],
    primaryKeys: [],
  });
  const [snowpipeConfig, setSnowpipeConfig] = useState({
    process_id: "",
    output_table_name: "",
    output_table_zone: "DLZ",
    file_format: "fmt_csv_01",
    pattern_type: "csv",
    stage_name: "dlz.stg_vcopt_snowflake",
  });
  const [validationConfig, setValidationConfig] = useState({
    selectedProcedure: "",
    parameters: {},
    customProcedureCall: "",
  });
  // const [mergeConfig, setMergeConfig] = useState({
  //   targetTable: "",
  //   sourceTable: "",
  //   joinCondition: "",
  //   matchedUpdates: [],
  //   notMatchedInserts: [],
  // });
  const [processConfig, setProcessConfig] = useState({
    additionalSql: "",
    useCte: false,
  });
  const [generatedPreview, setGeneratedPreview] = useState("");
  const [isFinalCodeModalOpen, setIsFinalCodeModalOpen] = useState(false);
  const [finalCode, setFinalCode] = useState("");
  const [outputNodeId, setOutputNodeId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimer = useRef(null);

  useEffect(() => {
    if (isFinalCodeModalOpen && outputNodeId) {
      setSaveStatus(""); // Reset status
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateNodeData(outputNodeId, { editedCode: finalCode });
        setSaveStatus("Saving...");
        setTimeout(() => setSaveStatus("Saved"), 500);
      }, 1000); // Debounce auto-save
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [finalCode, isFinalCodeModalOpen, outputNodeId]);

  const parseConstants = (code) => {
    const consts = {};
    const regex = /const\s+([a-z_]+)\s*=\s*['"]([^'"]*)['"]\s*;/g;
    const matches = [...code.matchAll(regex)];
    matches.forEach((match) => {
      consts[match[1]] = match[2];
    });
    return consts;
  };

  const updateProcessConfig = (newConfig) => {
    setProcessConfig(newConfig);
  };
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  };

  const updateInputCell = (index, value) => {
    const updated = [...inputCells];
    updated[index] = value;
    setInputCells(updated);
    if (selectedNode) {
      updateNodeData(selectedNode.id, { inputCells: updated });
    }
  };

  const addInputCell = () => {
    const updated = [...inputCells, ""];
    setInputCells(updated);
    if (selectedNode) {
      updateNodeData(selectedNode.id, { inputCells: updated });
    }
  };

  const deleteInputCell = (index) => {
    const updated = [...inputCells];
    updated.splice(index, 1);
    setInputCells(updated);
    if (selectedNode) {
      updateNodeData(selectedNode.id, { inputCells: updated });
    }
  };

  const clearAllInputCells = () => {
    setInputCells([]);
    if (selectedNode) {
      updateNodeData(selectedNode.id, { inputCells: [] });
    }
  };

  const parseDDL = (ddlContent) => {
    // Remove SQL comments at the top (/* ... */)
    ddlContent = ddlContent.replace(/\/\*[\s\S]*?\*\//g, "").trim();

    // Extract schema and table name - handle multiple CREATE TABLE variants
    const createTableMatch =
      ddlContent.match(
        /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i
      ) ||
      ddlContent.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i) ||
      ddlContent.match(
        /CREATE\s+OR\s+REPLACE\s+TABLE\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i
      );

    if (!createTableMatch) {
      console.error("Could not parse schema and table name from DDL");
      return null;
    }

    const schema = createTableMatch[1];
    const tableName = createTableMatch[2];

    // Extract table comment if available
    let tableComment = "";
    const tableCommentMatch = ddlContent.match(
      /COMMENT\s*=\s*['"]([^'"]*)['"]/i
    );
    if (tableCommentMatch) {
      tableComment = tableCommentMatch[1];
    }

    // Extract fields
    const fieldsSection = ddlContent.substring(
      ddlContent.indexOf("(") + 1,
      ddlContent.lastIndexOf(")")
    );

    const fieldLines = [];
    let currentLine = "";
    let parenthesesCount = 0;

    for (let i = 0; i < fieldsSection.length; i++) {
      const char = fieldsSection[i];

      if (char === "(") parenthesesCount++;
      else if (char === ")") parenthesesCount--;

      if (char === "," && parenthesesCount === 0) {
        fieldLines.push(currentLine.trim());
        currentLine = "";
      } else {
        currentLine += char;
      }
    }

    if (currentLine.trim()) {
      fieldLines.push(currentLine.trim());
    }

    // Parse each field
    const fields = [];
    const foreignKeys = [];
    const primaryKeys = [];

    fieldLines.forEach((line) => {
      line = line.trim();

      // Check if this is a constraint line
      if (line.toUpperCase().startsWith("CONSTRAINT")) {
        // Check if it's a primary key
        if (line.toUpperCase().includes("PRIMARY KEY")) {
          const pkMatch = line.match(
            /CONSTRAINT\s+([a-zA-Z0-9_]+)\s+PRIMARY\s+KEY\s*\(([^)]+)\)/i
          );

          if (pkMatch) {
            // Store primary key information
            primaryKeys.push({
              type: "primary",
              name: pkMatch[1],
              columns: pkMatch[2].split(",").map((col) => col.trim()),
            });
          }
        }
        // Check if it's a foreign key (standard SQL syntax)
        else if (line.toUpperCase().includes("FOREIGN KEY")) {
          const fkMatch = line.match(
            /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i
          );

          if (fkMatch) {
            foreignKeys.push({
              type: "foreign",
              columns: fkMatch[1].split(",").map((col) => col.trim()),
              referenceSchema: fkMatch[2],
              referenceTable: fkMatch[3],
              referenceColumns: fkMatch[4].split(",").map((col) => col.trim()),
            });
          }
        }
        // For other constraints like UNIQUE, CHECK, etc.
        else {
          const constraintMatch = line.match(
            /CONSTRAINT\s+([a-zA-Z0-9_]+)\s+([A-Z]+)/i
          );
          if (constraintMatch) {
            console.log(
              `${constraintMatch[2]} constraint detected: ${constraintMatch[1]}`
            );
          }
        }
        return;
      }

      // Parse regular field
      const fieldParts = line.split(/\s+/);
      if (fieldParts.length >= 2) {
        const fieldName = fieldParts[0];
        const fieldType = fieldParts[1];
        const isNotNull = line.toUpperCase().includes("NOT NULL");
        const commentMatch = line.match(/COMMENT\s+['"]([^'"]+)['"]/i);
        const comment = commentMatch ? commentMatch[1] : "";

        fields.push({
          name: fieldName,
          type: fieldType,
          notNull: isNotNull,
          comment: comment,
        });
      }
    });

    return {
      schema,
      tableName,
      tableComment,
      fields,
      foreignKeys,
      primaryKeys,
    };
  };

  const handleHeaderUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    // Check if it's a DDL file (SQL)
    if (inputType === "ddl" && file.name.endsWith(".sql")) {
      reader.onload = (evt) => {
        const content = evt.target.result;
        const parsedDDL = parseDDL(content);

        if (parsedDDL) {
          // Extract field names for the input cells
          const fieldNames = parsedDDL.fields.map((field) => field.name);
          setInputCells(fieldNames);
          setTableInfo(parsedDDL);

          if (selectedNode) {
            updateNodeData(selectedNode.id, {
              inputCells: fieldNames,
              tableInfo: parsedDDL,
              inputType: "ddl",
            });
          }
        }
      };
      reader.readAsText(file);
    } else {
      // Original CSV/Excel handling
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0] || [];
        const cleaned = headers.map((h) => h?.toString().trim() || "");
        setInputCells(cleaned);

        if (selectedNode) {
          updateNodeData(selectedNode.id, {
            inputCells: cleaned,
            inputType: "csv",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const addMappingRule = () => {
    setMappingRules([...mappingRules, { input_Name: "", output_Name: "" }]);
  };

  const updateMappingRule = (index, field, value) => {
    const updated = [...mappingRules];
    updated[index][field] = value;
    setMappingRules(updated);
  };

  const deleteMappingRule = (index) => {
    const updated = [...mappingRules];
    updated.splice(index, 1);
    setMappingRules(updated);
  };

  useEffect(() => {
    if (selectedNode?.data?.nodeType === "output" && isModalOpen) {
      generatePreview();
    }
  }, [selectedNode, isModalOpen, objectType, nodes]);

  const [editableConsts, setEditableConsts] = useState({});

  useEffect(() => {
    if (isFinalCodeModalOpen && objectType === "USP") {
      const newCode = computePreview(outputNodeId, editableConsts);
      setFinalCode(newCode);
    }
  }, [
    editableConsts,
    isFinalCodeModalOpen,
    objectType,
    outputNodeId,
    nodes,
    edges,
  ]);

  const handleTextareaChange = useCallback(
    (e) => {
      const newCode = e.target.value;
      setFinalCode(newCode);
      try {
        const { consts, customCode } = parseConstants(newCode);
        setEditableConsts(consts);
        const regenerated = computePreview(outputNodeId, consts, customCode);
        if (regenerated !== newCode && regenerated !== finalCode) {
          setFinalCode(regenerated);
        }
        setError("");
      } catch (err) {
        setError(`Error processing code: ${err.message}`);
        console.error("Error in textarea onChange:", err);
      }
    },
    [outputNodeId, finalCode]
  );

  const debouncedHandleTextareaChange = useDebounce(handleTextareaChange, 500);

  const computePreview = (nodeId, overrides = {}) => {
    const outputNode = nodes.find((node) => node.id === nodeId);
    if (!outputNode || outputNode.data.nodeType !== "output") return "";

    const attachedNodes = getUpstreamNodes(nodeId);
    const mergeNode = attachedNodes.find((n) => n?.data?.nodeType === "merge");

    let previewText = "";
    switch (objectType) {
      case "USP":
        if (!mergeNode) {
          previewText = "Error: No merge node found in the flow.";
          break;
        }

        const mergeData = mergeNode.data || {};
        const mergeConfig = mergeData.mergeConfig || {};
        const procedureName =
          mergeData.procedureName ||
          (mergeConfig.targetTable
            ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
            : "usp_default");
        const processId =
          overrides.process_id ||
          mergeData.processId ||
          (mergeConfig.targetTable
            ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
            : "usp_default");
        const targetTable =
          overrides.destination_table || mergeConfig.targetTable || "";
        const targetTableSchema =
          overrides.destination_table_schema ||
          mergeConfig.targetTableSchema ||
          "";
        const sourceTable = mergeConfig.sourceTable || "";
        const targetTemporary =
          overrides.target_table || (targetTable ? `tmp_${targetTable}` : "");
        const targetTemporarySchema =
          overrides.target_table_schema || mergeConfig.targetTableSchema || "";
        const processSchema =
          overrides.process_schema || mergeConfig.targetTableSchema || "";

        previewText = `CREATE OR REPLACE PROCEDURE ${procedureName}()\nRETURNS OBJECT\nLANGUAGE JAVASCRIPT\nCOMMENT = '${
          mergeConfig.comment || "資源価格マスタ_ODSデータ取込"
        }'\nEXECUTE AS CALLER\nAS $$\ntry {\n`;
        previewText += `  const target_table = '${targetTemporary}';\n  const target_table_schema = '${targetTemporarySchema}';\n  const destination_table = '${targetTable}';\n  const destination_table_schema = '${targetTableSchema}';\n  const process_id = '${processId}';\n  const process_schema = '${processSchema}';\n`;
        previewText +=
          "  snowflake.execute({ sqlText: 'BEGIN;' });\n  snowflake.execute({ sqlText: `USE SCHEMA ${destination_table_schema};` });\n  snowflake.execute({ sqlText: 'ALTER SESSION SET TIMEZONE = \"Asia/Tokyo\";' });\n";

        const inputNode = attachedNodes.find(
          (n) => n?.data?.nodeType === "input"
        );
        if (inputNode) {
          previewText += `  // Data Extraction from Input\n  snowflake.execute({ sqlText: \`CREATE OR REPLACE TEMPORARY TABLE ${targetTemporarySchema}.${targetTemporary} AS SELECT ${
            inputNode.data.inputCells?.join(", ") || "*"
          } FROM ${targetTemporarySchema}.${sourceTable} WHERE METADATA$ACTION = 'INSERT';\` });\n`;
        }

        const validationNodes = attachedNodes.filter(
          (n) => n?.data?.nodeType === "validation"
        );
        validationNodes.forEach((node, index) => {
          const config = node?.data?.validationConfig;
          if (config) {
            const procCall = config.customProcedureCall || config.procedureCall;
            if (procCall) {
              previewText += `  // Validation Step ${
                index + 1
              }\n  snowflake.execute({ sqlText: \`CALL ${processSchema}.${procCall}('${targetTemporary}', '${targetTemporarySchema}', '${targetTable}', '${targetTableSchema}', '${processId}', '${processSchema}'${
                procCall.includes("duplication")
                  ? ', \'[\\"RES_PRICE_PRODUCT_ID\\", \\"APPLY_START_DATE\\"]\''
                  : ""
              });\` });\n`;
            }
          }
        });

        if (mergeNode) {
          let mergeQuery = generateMergeQuery();
          mergeQuery = mergeQuery
            .replace(
              /^CREATE OR REPLACE PROCEDURE .* RETURNS STRING LANGUAGE SQL AS\s*BEGIN\s*/,
              ""
            )
            .replace(/\s*RETURN.*END;/, "")
            .trim();
          previewText += `  // Merge Step\n  snowflake.execute({ sqlText: \`${mergeQuery}\` });\n`;
        }

        previewText +=
          '  snowflake.execute({ sqlText: \'COMMIT;\' });\n  return { "status": "SUCCESS" };\n';
        previewText +=
          "} catch (err) {\n  snowflake.execute({ sqlText: 'ROLLBACK;' });\n  snowflake.execute({ sqlText: `DROP TABLE ${targetTemporarySchema}.${targetTemporary};` });\n  throw err;\n}\n$$;\n";
        break;

      case "TABLE":
        const inputNodeTable = attachedNodes.find(
          (n) => n?.data?.nodeType === "input"
        );
        const fields = inputNodeTable?.data?.inputCells || [];
        const tableName =
          mergeNode?.data?.mergeConfig?.targetTable || "dl_m_bg";
        const tableSchema =
          mergeNode?.data?.mergeConfig?.targetTableSchema || "dlz";
        previewText = `CREATE TABLE IF NOT EXISTS ${tableSchema}.${tableName} (\n`;
        fields.forEach((field) => {
          previewText += `  ${field} VARCHAR NULL COMMENT '${field.toUpperCase()}',\n`;
        });
        previewText += `  file_name VARCHAR NOT NULL COMMENT 'ファイル名',\n  row_number NUMBER NOT NULL COMMENT '行番号',\n  create_at TIMESTAMP_LTZ(7) NOT NULL COMMENT '作成日時',\n  update_at TIMESTAMP_LTZ(7) NULL COMMENT '更新日時',\n  process_at TIMESTAMP_LTZ(7) NOT NULL COMMENT '処理日時',\n  process_id VARCHAR(255) NOT NULL COMMENT '処理ID',\n  create_by VARCHAR NULL COMMENT '作成者',\n  update_by VARCHAR NULL COMMENT '更新者'\n) COMMENT = '${
          mergeNode?.data?.mergeConfig?.comment || "BGマスタ"
        }';\n`;
        break;

      case "PIPE":
        const snowpipeNode = attachedNodes.find(
          (n) => n?.data?.nodeType === "Snowpipe"
        );
        if (!snowpipeNode) {
          return "Error: No Snowpipe node found in the flow.";
        }
        const snowpipeData = snowpipeNode.data || {};
        const pipeConfig = snowpipeData.snowpipeConfig || {
          process_id: "",
          output_table_name: "dl_m_bg",
          output_table_zone: "dlz",
          file_format: "fmt_csv_02",
          pattern_type: "csv",
          stage_name: "dlz.stg_pv_tosnowflake",
        };
        const mappingRules = snowpipeData.mappingRules || [];
        const aggregationFields = snowpipeData.aggregationFields || [];
        const groupByFields = snowpipeData.groupByFields || [];

        // Use pipeConfig for target table/schema, not mergeNode
        const pipeName = pipeConfig.process_id
          ? `${pipeConfig.process_id.replace(/[^a-zA-Z0-9]/g, "_")}`
          : "pip_dl_m_bg";
        const targetTablePipe = pipeConfig.output_table_name || "dl_m_bg";
        const targetSchemaPipe = pipeConfig.output_table_zone || "dlz";
        const pipeComment =
          pipeConfig.comment ||
          mergeNode?.data?.mergeConfig?.comment ||
          "BGマスタ";

        // Validate mappings
        if (mappingRules.length === 0) {
          return "Error: No mapping rules defined for Snowpipe.";
        }

        previewText =
          `CREATE OR REPLACE PIPE ${targetSchemaPipe}.${pipeName}\n` +
          `  INTEGRATION = NTF_INT_EVENTS\n` +
          `  AUTO_INGEST = TRUE\n` +
          `  COMMENT = '${pipeComment}'\n` +
          `  AS\n` +
          `  COPY INTO ${targetSchemaPipe}.${targetTablePipe} (\n`;

        // Add output columns
        mappingRules.forEach((rule) => {
          if (rule.output_Name) {
            previewText += `    ${rule.output_Name},\n`;
          }
        });
        previewText +=
          `    file_name,\n` +
          `    row_number,\n` +
          `    create_at,\n` +
          `    update_at,\n` +
          `    process_at,\n` +
          `    process_id,\n` +
          `    create_by,\n` +
          `    update_by\n` +
          `  )\n` +
          `  FROM (\n` +
          `    SELECT\n`;

        // Handle aggregations or direct mappings
        if (aggregationFields.length > 0) {
          aggregationFields.forEach((agg) => {
            if (agg.field && agg.function) {
              const outputName =
                mappingRules.find((rule) => rule.input_Name === agg.field)
                  ?.output_Name || agg.field;
              previewText += `      ${agg.function}(${agg.field}) AS ${outputName},\n`;
            }
          });
        } else {
          mappingRules.forEach((rule) => {
            if (rule.input_Name && rule.output_Name) {
              previewText += `      t.${rule.input_Name} AS ${rule.output_Name},\n`;
            }
          });
        }

        // Add metadata fields
        previewText +=
          `      METADATA$FILENAME AS file_name,\n` +
          `      METADATA$FILE_ROW_NUMBER AS row_number,\n` +
          `      CURRENT_TIMESTAMP() AS create_at,\n` +
          `      NULL AS update_at,\n` +
          `      CURRENT_TIMESTAMP() AS process_at,\n` +
          `      '${pipeConfig.process_id || "PIP_DL_M_BG"}' AS process_id,\n` +
          `      t.$5 AS create_by,\n` +
          `      t.$6 AS update_by\n` +
          `    FROM\n` +
          `      @${pipeConfig.stage_name || "dlz.stg_pv_tosnowflake"}/${
            pipeConfig.output_table_zone || "azurepipeline/dl_m_bg"
          }/ (\n` +
          `        FILE_FORMAT => '${
            pipeConfig.file_format || "dlz.fmt_csv_02"
          }',\n` +
          `        pattern => '.*[.]${pipeConfig.pattern_type || "csv"}'\n` +
          `      ) t\n`;

        // Add GROUP BY if present
        if (groupByFields.length > 0) {
          const validGroupByFields = groupByFields.filter((field) => field);
          if (validGroupByFields.length > 0) {
            previewText += `    GROUP BY ${validGroupByFields.join(", ")}\n`;
          }
        }

        previewText += `  );\n`;
        break;

      case "UDF":
        const processNode = attachedNodes.find(
          (n) => n?.data?.nodeType === "process"
        );
        const processData = processNode?.data || {};
        const udfConfig = processData.processConfig || {};
        const udfName = udfConfig.additionalSql
          ? `udf_${udfConfig.additionalSql.replace(/[^a-zA-Z0-9]/g, "_")}`
          : "udf_convert_datetime_to_koma";
        const udfSchema =
          mergeNode?.data?.mergeConfig?.targetTableSchema || "rfz_common";
        previewText =
          `CREATE OR REPLACE FUNCTION ${udfSchema}.${udfName} (${
            udfConfig.params || "target_datetime TIMESTAMP_LTZ(0)"
          }) \n` +
          `RETURNS NUMBER(10,2)\n` +
          `COMMENT = '${
            mergeNode?.data?.mergeConfig?.comment || "日時-コマ変換"
          }'\n` +
          `AS\n` +
          `'${
            udfConfig.additionalSql ||
            "HOUR(CONVERT_TIMEZONE('Asia/Tokyo', target_datetime)) * 2 + IFF(MINUTE(CONVERT_TIMEZONE('Asia/Tokyo', target_datetime)) >= 30, 1, 0) + 1"
          }';\n`;
        break;

      default:
        previewText = "No valid object type selected.";
    }
    return previewText;
  };

  const generatePreview = () => {
    if (!selectedNode || selectedNode.data.nodeType !== "output") return;
    const previewText = computePreview(selectedNode.id);
    setGeneratedPreview(previewText);
  };

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      if (targetNode) {
        const allInputCells = getConnectedInputFields(params.target);

        setInputFieldMap((prev) => ({
          ...prev,
          [params.target]: allInputCells,
        }));

        updateNodeData(params.target, {
          inputCells: allInputCells,
        });
      }
    },
    [nodes, setEdges]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");

      if (!type) return;

      const position = reactFlowInstance.project({
        x:
          event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      const newNode = {
        id: `${type}_${+new Date()}`,
        type: "default",
        position,
        data: { label: `${type} node`, nodeType: type, inputCells: [] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      setIsModalOpen(true);
      setInputCells(node.data.inputCells || []);
      // For input nodes, load input type and table info
      if (node.data.nodeType === "input") {
        setInputType(node.data.inputType || "csv");
        if (node.data.tableInfo) {
          setTableInfo(node.data.tableInfo);
        } else {
          setTableInfo({
            schema: "",
            tableName: "",
            tableComment: "",
            fields: [],
            foreignKeys: [],
            primaryKeys: [],
          });
        }
      }
      if (node.data.aggregationFields) {
        setAggregationFields(node.data.aggregationFields);
      } else {
        setAggregationFields([]);
      }
      if (node.data.groupByFields) {
        setGroupByFields(node.data.groupByFields);
      } else {
        setGroupByFields([]);
      }
      // Load existing mapping rules and config if available
      if (node.data.mappingRules) {
        setMappingRules(node.data.mappingRules);
      } else {
        setMappingRules([]);
      }

      if (node.data.snowpipeConfig) {
        setSnowpipeConfig(node.data.snowpipeConfig);
      } else {
        setSnowpipeConfig({
          process_id: "",
          output_table_name: "",
          output_table_zone: "DLZ",
          file_format: "fmt_csv_01",
          pattern_type: "csv",
          stage_name: "dlz.stg_vcopt_snowflake",
        });
      }

      // Load validation configuration if available
      if (node.data.validationConfig) {
        setValidationConfig(node.data.validationConfig);
      } else {
        setValidationConfig({
          selectedProcedure: "",
          parameters: {},
          customProcedureCall: "",
        });
      }
    },
    [nodes, edges]
  );
  const getUpstreamNodes = (nodeId) => {
    let upstream = [];
    const traverse = (id) => {
      const incomingEdges = edges.filter((edge) => edge.target === id);
      incomingEdges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode && !upstream.find((n) => n.id === sourceNode.id)) {
          upstream.push(sourceNode);
          traverse(sourceNode.id);
        }
      });
    };
    traverse(nodeId);
    return upstream;
  };

  const handleValidationProcedureChange = (procedureName) => {
    if (procedureName === "custom") {
      // For custom validation, set a special configuration
      setValidationConfig({
        selectedProcedure: "custom",
        parameters: {},
        customProcedureCall: "",
        additionalSql: "",
        procedureCall: "",
      });
    } else {
      const selectedProc = validationSubprocedures.find(
        (p) => p.procedure === procedureName
      );

      if (selectedProc) {
        // Initialize parameters with empty values
        const initialParams = {};
        selectedProc.parameters.forEach((param) => {
          initialParams[param.name] = "";
        });

        const initialProcedureCall = `${procedureName}(${selectedProc.parameters
          .map((param) => `${param.name} => ''`)
          .join(", ")})`;
        setValidationConfig({
          selectedProcedure: procedureName,
          parameters: initialParams,
          procedureCall: initialProcedureCall,
        });
      }
    }
  };
  const handleProcedureCallChange = (e) => {
    setValidationConfig((prev) => ({
      ...prev,
      procedureCall: e.target.value,
    }));
  };
  const updateValidationParameter = (paramName, value) => {
    setValidationConfig((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramName]: value,
      },
    }));
  };

  const updateCustomProcedureCall = (value) => {
    setValidationConfig((prev) => ({
      ...prev,
      customProcedureCall: value,
    }));
  };

  // Function to get input fields from connected nodes
  const getConnectedInputFields = (nodeId) => {
    const visited = new Set();
    const collected = [];

    const traverse = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const incoming = edges.filter((edge) => edge.target === id);
      incoming.forEach((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        if (sourceNode) {
          // If it's an input node, collect its fields
          if (
            sourceNode.data.nodeType === "input" &&
            Array.isArray(sourceNode.data.inputCells)
          ) {
            collected.push(...sourceNode.data.inputCells);
          }
          // Traverse upstream recursively
          traverse(sourceNode.id);
        }
      });
    };

    traverse(nodeId);
    return Array.from(new Set(collected)); // remove duplicates
  };

  const onNodeDragStart = (event, node) => {
    setDraggedNodeId(node.id);
  };

  const onNodeDragStop = (event, node) => {
    const bin = document.getElementById("recycle-bin");
    const binRect = bin.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    if (
      mouseX >= binRect.left &&
      mouseX <= binRect.right &&
      mouseY >= binRect.top &&
      mouseY <= binRect.bottom
    ) {
      setNodes((nds) => nds.filter((n) => n.id !== draggedNodeId));
    }

    setDraggedNodeId(null);
  };
  const [mergeConfig, setMergeConfig] = useState({
    targetTable: "",
    sourceTable: "",
    sourceQuery: "",
    joinConditions: [],
    matchedUpdates: [],
    notMatchedInserts: [],
    useCte: true,
    joinType: "INNER",
    useJoin: true,
    whereClause: "",
    previewMergeQuery: "",
  });

  const [customValues, setCustomValues] = useState({
    matchedUpdates: {},
    notMatchedInserts: {},
  });

  const handleMergeChange = (e) => {
    const { name, value } = e.target;
    setMergeConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleField = (fieldType, field) => {
    setMergeConfig((prev) => {
      const currentFields = prev[fieldType];
      const updatedFields = currentFields.includes(field)
        ? currentFields.filter((f) => f !== field)
        : [...currentFields, field];
      return { ...prev, [fieldType]: updatedFields };
    });
  };

  const handleCustomValueChange = (fieldType, field, value) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldType]: { ...prev[fieldType], [field]: value },
    }));
  };

  const addJoinCondition = () => {
    setMergeConfig((prev) => ({
      ...prev,
      joinConditions: [
        ...prev.joinConditions,
        { field: "", operator: "=", value: "", connector: "AND" },
      ],
    }));
  };

  const updateJoinCondition = (index, key, value) => {
    const updatedConditions = [...mergeConfig.joinConditions];
    updatedConditions[index][key] = value;
    setMergeConfig((prev) => ({ ...prev, joinConditions: updatedConditions }));
  };

  const removeJoinCondition = (index) => {
    const updatedConditions = mergeConfig.joinConditions.filter(
      (_, i) => i !== index
    );
    setMergeConfig((prev) => ({ ...prev, joinConditions: updatedConditions }));
  };

  const saveMergeConfig = () => {
    if (selectedNode) {
      const procedureName = mergeConfig.targetTable
        ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
        : "usp_default";
      const processId = mergeConfig.targetTable
        ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
        : "usp_default";
      const savedData = {
        mergeConfig: { ...mergeConfig },
        procedureName,
        processId,
      };
      updateNodeData(selectedNode.id, {
        mergeConfig: { ...mergeConfig },
        processId,
      }); // debugging
      //console.log("Saved Merge Node Data:", savedData);
      setMergeConfig((prev) => ({
        ...prev,
        previewMergeQuery: generateMergeQuery(),
      }));
      setIsModalOpen(false);
    } else {
      console.error("No selected node available to save merge config.");
    }
  };

  const generateMergeQuery = () => {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "CET",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Define availableFields, processId, procedureName, and sourceQueryTemplate
    const availableFields = getConnectedInputFields(selectedNode?.id) || [];
    const processId = mergeConfig.targetTable
      ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "";
    const procedureName = mergeConfig.targetTable
      ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "usp_default";
    const sourceQueryTemplate = mergeConfig.useCte
      ? `WITH temp1 AS (SELECT ${availableFields.join(", ") || "*"} FROM ${
          mergeConfig.sourceTable || "<sourceTable>"
        } WHERE METADATA$ACTION = 'INSERT') SELECT * FROM temp1`
      : `SELECT ${availableFields.join(", ") || "*"} FROM ${
          mergeConfig.sourceTable || "<sourceTable>"
        }`;

    const joinConditionStr = mergeConfig.joinConditions
      .filter((cond) => cond.field && cond.value)
      .map((cond, index) => {
        const value = cond.value.startsWith("source.")
          ? cond.value
          : `'${cond.value}'`;
        return `${index > 0 ? cond.connector + " " : ""}target.${cond.field} ${
          cond.operator
        } ${value}`;
      })
      .join(" ");
    const onClause =
      mergeConfig.useJoin && joinConditionStr
        ? `ON (${joinConditionStr})`
        : `ON (target.kks_plant_code = source.kks_ext_code)`; // Default ON if no join conditions
    const whereClause = mergeConfig.whereClause
      ? `WHERE ${mergeConfig.whereClause}`
      : "";

    const sourceQuery = mergeConfig.useCte
      ? `WITH temp1 AS (SELECT ${availableFields.join(", ") || "*"} FROM ${
          mergeConfig.sourceTable || "<sourceTable>"
        } ${whereClause}) SELECT ${
          availableFields.join(", ") || "*"
        } FROM temp1`
      : `SELECT ${availableFields.join(", ") || "*"} FROM ${
          mergeConfig.sourceTable || "<sourceTable>"
        } ${whereClause}`;

    const matchedUpdatesStr = mergeConfig.matchedUpdates
      .map((field) => {
        const customValue =
          customValues.matchedUpdates[field] || `source.${field}`;
        return `target.${field} = ${customValue}`;
      })
      .concat(
        mergeConfig.matchedUpdates.includes("update_at")
          ? [`target.update_at = CURRENT_TIMESTAMP()`]
          : [],
        mergeConfig.matchedUpdates.includes("process_id")
          ? [`target.process_id = '${processId}'`]
          : []
      )
      .join(", ");

    const notMatchedInsertsStr = mergeConfig.notMatchedInserts
      .map((field) => field)
      .concat(
        mergeConfig.notMatchedInserts.includes("create_at")
          ? ["create_at"]
          : [],
        mergeConfig.notMatchedInserts.includes("process_at")
          ? ["process_at"]
          : [],
        mergeConfig.notMatchedInserts.includes("process_id")
          ? ["process_id"]
          : []
      )
      .join(", ");

    const notMatchedValuesStr = mergeConfig.notMatchedInserts
      .map((field) => {
        const customValue =
          customValues.notMatchedInserts[field] || `source.${field}`;
        return customValue;
      })
      .concat(
        mergeConfig.notMatchedInserts.includes("create_at")
          ? ["CURRENT_TIMESTAMP()"]
          : [],
        mergeConfig.notMatchedInserts.includes("process_at")
          ? ["CURRENT_TIMESTAMP()"]
          : [],
        mergeConfig.notMatchedInserts.includes("process_id")
          ? [`'${processId}'`]
          : []
      )
      .join(", ");

    return `
MERGE INTO ${mergeConfig.targetTable || "targetTable"} AS target
USING (${sourceQuery}) AS source
${onClause}
${matchedUpdatesStr ? `WHEN MATCHED THEN UPDATE SET ${matchedUpdatesStr} ` : ""}
${
  notMatchedInsertsStr
    ? `WHEN NOT MATCHED THEN INSERT (${notMatchedInsertsStr}) VALUES (${notMatchedValuesStr})`
    : ""
};
`;
  };

  const renderModalContent = () => {
    if (!selectedNode) return null;
    switch (selectedNode.data.nodeType) {
      case "input":
        // Handle changes to input cells (for CSV mode)
        return (
          <InputConfigModal
            setInputCells={setInputCells}
            inputType={inputType}
            setInputType={setInputType}
            handleHeaderUpload={handleHeaderUpload}
            tableInfo={tableInfo}
            inputCells={inputCells}
            addInputCell={addInputCell}
            deleteInputCell={deleteInputCell}
            updateInputCell={updateInputCell}
            clearAllInputCells={clearAllInputCells}
          />
        );
      case "Snowpipe":
        return (
          <SnowpipeMappingSection
            snowpipeConfig={snowpipeConfig}
            setSnowpipeConfig={setSnowpipeConfig}
            mappingRules={mappingRules}
            setMappingRules={setMappingRules}
            selectedNode={selectedNode}
            addMappingRule={addMappingRule}
            deleteMappingRule={deleteMappingRule}
          />
        );

      case "merge":
        const availableFields = getConnectedInputFields(selectedNode.id) || [];
        const processId = mergeConfig.targetTable
          ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
          : "";
        const procedureName = mergeConfig.targetTable
          ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
          : "usp_default";
        const sourceQueryTemplate = mergeConfig.useCte
          ? `WITH temp1 AS (SELECT ${
              availableFields.length > 0 ? availableFields.join(", ") : "*"
            } FROM ${
              mergeConfig.sourceTable || "<sourceTable>"
            } WHERE METADATA$ACTION = 'INSERT') SELECT * FROM temp1`
          : `SELECT ${
              availableFields.length > 0 ? availableFields.join(", ") : "*"
            } FROM ${mergeConfig.sourceTable || "<sourceTable>"}`;

        const saveMergeConfig = () => {
          if (selectedNode) {
            updateNodeData(selectedNode.id, {
              mergeConfig: { ...mergeConfig },
              processId,
            });
            console.log("Saved Merge Data:", {
              mergeConfig: { ...mergeConfig },
              procedureName,
              processId,
            });
            setIsModalOpen(false);
          }
        };
        return (
          <MergeConfigModal
            mergeConfig={mergeConfig}
            setMergeConfig={setMergeConfig}
            selectedNode={selectedNode}
            availableFields={availableFields}
            processId={processId}
            procedureName={procedureName}
            sourceQueryTemplate={sourceQueryTemplate}
            customValues={customValues}
            addJoinCondition={addJoinCondition}
            updateJoinCondition={updateJoinCondition}
            removeJoinCondition={removeJoinCondition}
            handleMergeChange={handleMergeChange}
            handleToggleField={handleToggleField}
            handleCustomValueChange={handleCustomValueChange}
            generateMergeQuery={generateMergeQuery}
            saveMergeConfig={saveMergeConfig}
            setIsModalOpen={setIsModalOpen}
          />
        );

      case "process":
        return (
          <ProcessModal
            processConfig={processConfig}
            updateProcessConfig={updateProcessConfig}
          />
        );
      case "validation":
        return (
          <ValidationModal
            selectedNode={selectedNode}
            validationConfig={validationConfig}
            validationSubprocedures={validationSubprocedures}
            handleValidationProcedureChange={handleValidationProcedureChange}
            updateValidationParameter={updateValidationParameter}
            updateCustomProcedureCall={updateCustomProcedureCall}
            getConnectedInputFields={getConnectedInputFields}
          />
        );
      case "aggregation":
        return (
          <AggregationModal selectedNode={selectedNode} setNodes={setNodes} />
        );
      case "output":
        const attachedNodes = getUpstreamNodes(selectedNode.id);
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
              <h4
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "16px",
                  color: "#0369a1",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "8px", fontSize: "18px" }}>📤</span>
                Output Preview
              </h4>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 15 }}
              >
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
                    Attached Nodes
                  </label>
                  <div
                    style={{
                      padding: "10px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      minHeight: "100px",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      fontSize: "14px",
                      overflowY: "auto",
                    }}
                  >
                    {attachedNodes.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {attachedNodes.map((node, index) => (
                          <li key={index}>{node.data.nodeType} Node</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        No nodes attached yet. Attach input, Snowpipe, process,
                        validation, or merge nodes.
                      </p>
                    )}
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
                    Generated Object Preview
                  </label>
                  <textarea
                    value={generatedPreview}
                    readOnly={true}
                    placeholder="Generated SQL preview will appear here..."
                    style={{
                      width: "100%",
                      minHeight: "200px",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      resize: "vertical",
                      cursor: "not-allowed",
                    }}
                  />
                  <button
                    onClick={generatePreview}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Generate Preview
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return <p>No modal for this type.</p>;
    }
  };

  const saveNodeData = () => {
    if (!selectedNode) {
      console.error("No selected node available to save data.");
      return;
    }
    let procedureName = "usp_default";
    let processId = "usp_default";
    if (selectedNode.data.nodeType === "merge") {
      procedureName = mergeConfig.targetTable
        ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
        : "usp_default";
      processId = mergeConfig.targetTable
        ? `usp_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
        : "usp_default";
    }

    switch (selectedNode.data.nodeType) {
      case "input":
        // Assume inputCells is the state variable holding the updated columns
        const updated = inputCells || []; // Default to empty array if undefined
        updateNodeData(selectedNode.id, {
          inputCells: updated,
          outputs: {
            columns: updated,
            process_id: inputFieldMap.process_id,
            output_table_name: inputFieldMap.output_table_name,
            output_table_zone: inputFieldMap.output_table_zone,
          },
        });
        break;

      case "Snowpipe":
        updateNodeData(selectedNode.id, {
          snowpipeConfig,
          mappingRules,
          aggregationFields,
          groupByFields,
        });
        break;

      case "validation":
        updateNodeData(selectedNode.id, {
          validationConfig,
          outputs: { parameters: validationConfig.parameters },
        });
        break;

      case "merge":
        updateNodeData(selectedNode.id, {
          mergeConfig,
          outputs: {
            mergedColumns: mergeConfig.columns,
            process_id: mergeConfig.process_id,
            output_table_name: mergeConfig.targetTable,
            output_table_zone: mergeConfig.targetZone,
          },
        });
        break;

      case "output":
        // Save the current generated preview when closing the output config modal
        updateNodeData(selectedNode.id, { generatedPreview });
        break;

      default:
        console.warn(
          `No save logic defined for node type: ${selectedNode.data.nodeType}`
        );
    }
    setIsModalOpen(false);
  };

  const isValidConnection = (connection) => {
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);
    if (!sourceNode || !targetNode) return false;
    // Allow any node to connect to any other node
    return true;
  };
  const handleGenerateCode = async () => {
    if (!nodes.length) {
      setError("Please add at least one node to the flow");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const outputNode = nodes.find((node) => node.data.nodeType === "output");
      if (!outputNode) {
        throw new Error("Please add an output node to the flow");
      }

      setOutputNodeId(outputNode.id);

      // Always compute the latest preview for real-time updates
      const latestPreview = computePreview(outputNode.id);

      // Update the node with the latest generated preview
      updateNodeData(outputNode.id, { generatedPreview: latestPreview });

      // Use editedCode if it exists, otherwise the latest preview
      const initialCode = outputNode.data.editedCode || latestPreview;
      setFinalCode(initialCode);

      // Parse initial constants for the form
      const parsed = parseConstants(initialCode);
      setEditableConsts(parsed);

      setIsFinalCodeModalOpen(true);
    } catch (err) {
      setError(err.message || "Error generating code");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="draw-process-container"
      style={{
        display: "flex",
        position: "relative",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        className="toolbox"
        style={{
          width: 220,
          background: "#fff",
          borderRight: "1px solid #e6e9ed",
          padding: "20px",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{
            margin: "0 0 25px 0",
            color: "#1a3353",
            fontSize: "18px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Flow Components</span>
          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "normal",
              background: "#f3f4f6",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Drag & Drop
          </span>
        </h3>

        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {toolboxItems.map((item) => (
            <div
              key={item.type}
              className="toolbox-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reactflow", item.type);
                e.dataTransfer.effectAllowed = "move";
              }}
              style={{
                padding: "12px 15px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "grab",
                display: "flex",
                alignItems: "center",
                color: "#334155",
                fontWeight: 500,
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  borderColor: "#cbd5e1",
                },
              }}
            >
              <span style={{ marginRight: "10px", fontSize: "18px" }}>
                {item.icon}
              </span>
              {item.label}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            borderTop: "1px solid #e6e9ed",
            paddingTop: "15px",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          <p>
            Drag components to the canvas and connect them to create your data
            flow pipeline.
          </p>
        </div>
      </div>

      <div
        className="flow-wrapper"
        ref={reactFlowWrapper}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          fitView
          defaultEdgeOptions={{
            animated: true,
            style: {
              stroke: "#5b8fb9",
              strokeWidth: 2,
            },
          }}
        >
          <Panel position="top-left" style={{ padding: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#475569",
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: "20px" }}>🔄</span> Snowflake Data
              Pipeline Builder
            </div>
          </Panel>

          <MiniMap
            style={{
              height: 120,
              width: 200,
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
            nodeStrokeColor={(n) => {
              return "#fff";
            }}
            zoomable
            pannable
          />
          <Controls
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "4px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              backgroundColor: "#fff",
            }}
          />
          <Background variant="dots" gap={12} size={1} color="#e2e8f0" />
          <Panel position="top-right">
            <button
              onClick={handleGenerateCode}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(59,130,246,0.3)",
                transition: "all 0.2s",
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
              }} // Creative hover animation
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            >
              {loading ? (
                <>
                  <svg
                    style={{
                      width: "20px",
                      height: "20px",
                      animation: "spin 1s linear infinite",
                    }}
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="30 30"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <span style={{ animation: "pulse 2s infinite" }}>✨</span>{" "}
                  {/* Dynamic icon pulse for creativity */}
                  Generate Code
                </>
              )}
            </button>
          </Panel>
          {error && (
            <Panel position="top-center">
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <span style={{ fontSize: "18px" }}>⚠️</span>
                {error}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <div
        id="recycle-bin"
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          background: "#fff",
          border: "2px dashed #ef4444",
          borderRadius: "8px",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 100,
          transition: "all 0.2s ease",
          transform: draggedNodeId ? "scale(1.05)" : "scale(1)",
        }}
      >
        🗑️ <span style={{ fontWeight: 500 }}>Drop to Delete</span>
      </div>

      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal"
            style={{
              background: "white",
              padding: 30,
              borderRadius: 12,
              width: 900,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              border: "1px solid #e2e8f0",
              animation: "fadeInScale 0.2s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 15,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1e293b",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginRight: 10,
                    width: 24,
                    height: 24,
                    background: getNodeTypeColor(selectedNode?.data?.nodeType),
                    borderRadius: "50%",
                    verticalAlign: "middle",
                  }}
                ></span>
                {selectedNode?.data?.label}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94a3b8",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "all 0.2s",
                  "&:hover": {
                    background: "#f1f5f9",
                    color: "#475569",
                  },
                }}
              >
                ×
              </button>
            </div>
            {renderModalContent()}
            <div
              style={{
                marginTop: 25,
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                paddingTop: 20,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#475569",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveNodeData}
                style={{
                  padding: "8px 16px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  boxShadow: "0 2px 5px rgba(59,130,246,0.3)",
                }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isFinalCodeModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal"
            style={{
              background: "white",
              padding: 30,
              borderRadius: 12,
              width: 900,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              border: "1px solid #e2e8f0",
              animation: "fadeInScale 0.2s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 15,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1e293b",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginRight: 10,
                    width: 24,
                    height: 24,
                    background: "#2f54eb",
                    borderRadius: "50%",
                    verticalAlign: "middle",
                  }}
                ></span>
                Final Generated Code
              </h3>
              <button
                onClick={() => setIsFinalCodeModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94a3b8",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "all 0.2s",
                }}
              >
                ×
              </button>
            </div>
            {objectType === "USP" && (
              <div
                style={{
                  background: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "16px",
                    color: "#0369a1",
                  }}
                >
                  Edit variables
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "15px",
                  }}
                >
                  {Object.keys(editableConsts).map((key) => (
                    <div key={key}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "6px",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        {key}
                      </label>
                      <input
                        type="text"
                        value={editableConsts[key]}
                        onChange={(e) =>
                          setEditableConsts((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setEditableConsts(parseConstants(finalCode))}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Sync Variables from Code
                </button>
                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Edit variables here to auto-update usages in the code. Use the
                  textarea below for other custom edits.
                </p>
              </div>
            )}
            <div
              style={{
                background: "#f0f9ff",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #bae6fd",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#334155",
                }}
              >
                Edit Your Final SQL Code
              </label>
              <textarea
                value={finalCode}
                onChange={(e) => setFinalCode(e.target.value)}
                placeholder="Your generated SQL code will appear here for editing..."
                style={{
                  width: "100%",
                  minHeight: "400px",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  backgroundColor: "#fff",
                  color: "#334155",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                }}
              />
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>
                  💡 Tip: Use Ctrl+Z for undo. Code is auto-saved on change.
                </span>
              </div>
              <div
                style={{ marginTop: "5px", color: "#10b981", fontSize: "12px" }}
              >
                {saveStatus}
              </div>
            </div>
            <div
              style={{
                marginTop: 25,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                paddingTop: 20,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(finalCode)}
                  style={{
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([finalCode], { type: "text/sql" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "generated_code.sql";
                    a.click();
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#8b5cf6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ⬇️ Download SQL
                </button>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setIsFinalCodeModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#475569",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateNodeData(outputNodeId, { editedCode: finalCode }); // Ensure final save
                    onCodeGenerated(finalCode);
                    setIsFinalCodeModalOpen(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    boxShadow: "0 2px 5px rgba(59,130,246,0.3)",
                  }}
                >
                  Generate & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getNodeTypeColor(nodeType) {
  const colorMap = {
    input: "#1890ff",
    Snowpipe: "#52c41a",
    process: "#fa8c16",
    validation: "#722ed1",
    merge: "#eb2f96",
    output: "#2f54eb",
  };
  return colorMap[nodeType] || "#94a3b8";
}

export default function DrawProcess({ onCodeGenerated, objectType }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas onCodeGenerated={onCodeGenerated} objectType={objectType} />
    </ReactFlowProvider>
  );
}
