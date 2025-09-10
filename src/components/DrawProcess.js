import axios from "axios";
import { useCallback, useRef, useState } from "react";
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
import CustomNode from "../components/CustomNode";
import AggregationModal from "../components/AggregationModal";
import ValidationModal from "../components/ValidationModal";
import ProcessModal from "../components/ProcessModal";
import FileUploadSection from "../components/FileUploadSection";
import SnowpipeMappingSection from "../components/SnowpipeMappingSection";
import InputConfigModal from "../components/InputConfigModal";
import MergeConfigModal from "../components/MergeConfigModal";

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
    procedure: "trz_vc_opt.usp_sub_date_consistency_validation",
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
    procedure: "trz_vc_opt.usp_sub_data_type_validation",
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
    procedure: "trz_vc_opt.usp_sub_null_check_validation",
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

function FlowCanvas({ onCodeGenerated }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
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
  const [inputType, setInputType] = useState("csv"); // "csv" or "ddl"
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
    console.log("first  hereeee");
    if (!file) return; //
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

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode?.data?.inputCells && targetNode) {
        const updatedMap = {
          ...inputFieldMap,
          [params.target]: sourceNode.data.inputCells,
        };
        setInputFieldMap(updatedMap);
        updateNodeData(params.target, {
          inputCells: sourceNode.data.inputCells,
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

  const handleValidationProcedureChange = (procedureName) => {
    if (procedureName === "custom") {
      // For custom validation, set a special configuration
      setValidationConfig({
        selectedProcedure: "custom",
        parameters: {},
        customProcedureCall: "",
        additionalSql: "",
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

        setValidationConfig({
          selectedProcedure: procedureName,
          parameters: initialParams,
        });
      }
    }
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
    // Find all edges where this node is the target
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);

    // Get all source nodes
    const sourceNodeIds = incomingEdges.map((edge) => edge.source);

    // Get all input fields from source nodes
    let allInputFields = [];
    sourceNodeIds.forEach((sourceId) => {
      const sourceNode = nodes.find((node) => node.id === sourceId);
      if (
        sourceNode &&
        sourceNode.data.nodeType === "input" &&
        sourceNode.data.inputCells
      ) {
        allInputFields = [...allInputFields, ...sourceNode.data.inputCells];
      }
    });

    return allInputFields;
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
      updateNodeData(selectedNode.id, { mergeConfig });
      setIsModalOpen(false);
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
    }); // e.g., "07/04/2025, 09:46"

    // Define availableFields, processId, procedureName, and sourceQueryTemplate here to avoid ReferenceError
    const availableFields = getConnectedInputFields(selectedNode?.id) || [];
    const processId = mergeConfig.targetTable
      ? `proc_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}_v1`
      : "";
    const procedureName = mergeConfig.targetTable
      ? `usp_merge_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "usp_merge_default";
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

    return `CREATE OR REPLACE PROCEDURE ${procedureName}() RETURNS STRING LANGUAGE SQL AS
BEGIN
MERGE INTO ${mergeConfig.targetTable || "targetTable"} AS target
USING (${sourceQuery}) AS source
${onClause}
${matchedUpdatesStr ? "WHEN MATCHED THEN UPDATE SET ${matchedUpdatesStr} " : ""}
${
  notMatchedInsertsStr
    ? "WHEN NOT MATCHED THEN INSERT (${notMatchedInsertsStr}) VALUES (${notMatchedValuesStr})"
    : ""
};
RETURN "status": "SUCCESS";
END;`;
  };

  const renderModalContent = () => {
    if (!selectedNode) return null;
    switch (selectedNode.data.nodeType) {
      case "input":
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
          ? `proc_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}_v1`
          : "";
        const procedureName = mergeConfig.targetTable
          ? `usp_merge_${mergeConfig.targetTable.replace(/[^a-zA-Z0-9]/g, "_")}`
          : "usp_merge_default";
        const sourceQueryTemplate = mergeConfig.useCte
          ? `WITH temp1 AS (SELECT ${
              availableFields.length > 0 ? availableFields.join(", ") : "*"
            } FROM ${
              mergeConfig.sourceTable || "<sourceTable>"
            } WHERE METADATA$ACTION = 'INSERT') SELECT * FROM temp1`
          : `SELECT ${
              availableFields.length > 0 ? availableFields.join(", ") : "*"
            } FROM ${mergeConfig.sourceTable || "<sourceTable>"}`;
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
          // <>
          //   <div
          //     style={{
          //       background: "#f8fafc",
          //       padding: "15px",
          //       borderRadius: "8px",
          //       marginBottom: "25px",
          //       border: "1px solid #e2e8f0",
          //     }}
          //   >
          //     <h4
          //       style={{
          //         margin: "0 0 15px 0",
          //         fontSize: "16px",
          //         color: "#1e293b",
          //         display: "flex",
          //         alignItems: "center",
          //       }}
          //     >
          //       <span style={{ marginRight: "8px", fontSize: "18px" }}>🔄</span>
          //       Merge Configuration
          //     </h4>
          //     <div style={{ display: "grid", gap: 15 }}>
          //       {/* Target Table */}
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           Target Table
          //         </label>
          //         <input
          //           name="targetTable"
          //           value={mergeConfig.targetTable}
          //           onChange={handleMergeChange}
          //           placeholder="e.g., rfz_ope_and_mte.dm_m_cams_coal_ash_ship_dist"
          //           style={{
          //             width: "100%",
          //             padding: "10px",
          //             borderRadius: "6px",
          //             border: "1px solid #cbd5e1",
          //             fontSize: "14px",
          //           }}
          //         />
          //       </div>
          //       {/* Source Table */}
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           Source Table
          //         </label>
          //         <input
          //           name="sourceTable"
          //           value={mergeConfig.sourceTable}
          //           onChange={handleMergeChange}
          //           placeholder="e.g., trz_ope_and_mte.str_od_m_cams_coal_ash_ship_dist_01"
          //           style={{
          //             width: "100%",
          //             padding: "10px",
          //             borderRadius: "6px",
          //             border: "1px solid #cbd5e1",
          //             fontSize: "14px",
          //           }}
          //         />
          //       </div>
          //       {/* Source Query */}
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           Source Query
          //         </label>
          //         <textarea
          //           name="sourceQuery"
          //           value={mergeConfig.sourceQuery || sourceQueryTemplate}
          //           onChange={handleMergeChange}
          //           style={{
          //             width: "100%",
          //             padding: "10px",
          //             borderRadius: "6px",
          //             border: "1px solid #cbd5e1",
          //             fontSize: "14px",
          //             minHeight: "100px",
          //           }}
          //         />
          //         <label
          //           style={{
          //             marginTop: "5px",
          //             fontSize: "12px",
          //             color: "#64748b",
          //           }}
          //         >
          //           <input
          //             type="checkbox"
          //             checked={mergeConfig.useCte}
          //             onChange={(e) =>
          //               setMergeConfig((prev) => ({
          //                 ...prev,
          //                 useCte: e.target.checked,
          //               }))
          //             }
          //           />{" "}
          //           Use CTE
          //         </label>
          //       </div>
          //       {/* Join Conditions */}
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           Join Conditions
          //         </label>
          //         <div
          //           style={{
          //             border: "1px solid #cbd5e1",
          //             borderRadius: "6px",
          //             padding: "10px",
          //             maxHeight: "250px", // Increased height to accommodate WHERE
          //             overflowY: "auto",
          //             backgroundColor: "#fff",
          //           }}
          //         >
          //           <div style={{ marginBottom: "10px" }}>
          //             <label
          //               style={{
          //                 display: "flex",
          //                 alignItems: "center",
          //                 gap: "8px",
          //               }}
          //             >
          //               <input
          //                 type="checkbox"
          //                 checked={mergeConfig.useJoin || false}
          //                 onChange={(e) =>
          //                   setMergeConfig((prev) => ({
          //                     ...prev,
          //                     useJoin: e.target.checked,
          //                   }))
          //                 }
          //                 style={{ marginRight: "5px" }}
          //               />
          //               Include Join Conditions
          //             </label>
          //           </div>

          //           {mergeConfig.useJoin && (
          //             <div>
          //               <div style={{ marginBottom: "10px" }}>
          //                 <label
          //                   style={{
          //                     display: "block",
          //                     marginBottom: "6px",
          //                     fontSize: "14px",
          //                     fontWeight: 500,
          //                     color: "#334155",
          //                   }}
          //                 >
          //                   Join Type
          //                 </label>
          //                 <select
          //                   value={mergeConfig.joinType || "INNER"}
          //                   onChange={(e) =>
          //                     setMergeConfig((prev) => ({
          //                       ...prev,
          //                       joinType: e.target.value,
          //                     }))
          //                   }
          //                   style={{
          //                     width: "100%",
          //                     padding: "8px",
          //                     borderRadius: "6px",
          //                     border: "1px solid #cbd5e1",
          //                     fontSize: "14px",
          //                   }}
          //                 >
          //                   <option value="INNER">INNER</option>
          //                   <option value="LEFT">LEFT</option>
          //                   <option value="RIGHT">RIGHT</option>
          //                   <option value="FULL">FULL</option>
          //                 </select>
          //               </div>

          //               {mergeConfig.joinConditions.map((cond, index) => (
          //                 <div
          //                   key={index}
          //                   style={{
          //                     marginBottom: "10px",
          //                     display: "flex",
          //                     gap: "10px",
          //                     alignItems: "center",
          //                   }}
          //                 >
          //                   {index === 0 && (
          //                     <span style={{ alignSelf: "center" }}>ON</span>
          //                   )}
          //                   <select
          //                     value={cond.field}
          //                     onChange={(e) =>
          //                       updateJoinCondition(
          //                         index,
          //                         "field",
          //                         e.target.value
          //                       )
          //                     }
          //                     style={{
          //                       padding: "8px",
          //                       borderRadius: "6px",
          //                       border: "1px solid #cbd5e1",
          //                       flex: 1,
          //                     }}
          //                   >
          //                     <option value="">-- Select Field --</option>
          //                     {availableFields.map((field) => (
          //                       <option key={field} value={field}>
          //                         {field}
          //                       </option>
          //                     ))}
          //                   </select>
          //                   <select
          //                     value={cond.operator}
          //                     onChange={(e) =>
          //                       updateJoinCondition(
          //                         index,
          //                         "operator",
          //                         e.target.value
          //                       )
          //                     }
          //                     style={{
          //                       padding: "8px",
          //                       borderRadius: "6px",
          //                       border: "1px solid #cbd5e1",
          //                     }}
          //                   >
          //                     <option value="=">=</option>
          //                     <option value="!=">!=</option>
          //                     <option value=">">{">"}</option>
          //                     <option value="<">{"<"}</option>
          //                   </select>
          //                   <input
          //                     value={cond.value}
          //                     onChange={(e) =>
          //                       updateJoinCondition(
          //                         index,
          //                         "value",
          //                         e.target.value
          //                       )
          //                     }
          //                     placeholder="Value or Field"
          //                     style={{
          //                       padding: "8px",
          //                       borderRadius: "6px",
          //                       border: "1px solid #cbd5e1",
          //                       flex: 1,
          //                     }}
          //                   />
          //                   {index > 0 && (
          //                     <select
          //                       value={cond.connector}
          //                       onChange={(e) =>
          //                         updateJoinCondition(
          //                           index,
          //                           "connector",
          //                           e.target.value
          //                         )
          //                       }
          //                       style={{
          //                         padding: "8px",
          //                         borderRadius: "6px",
          //                         border: "1px solid #cbd5e1",
          //                       }}
          //                     >
          //                       <option value="AND">AND</option>
          //                       <option value="OR">OR</option>
          //                     </select>
          //                   )}
          //                   <button
          //                     onClick={() => removeJoinCondition(index)}
          //                     style={{
          //                       padding: "8px",
          //                       background: "#ef4444",
          //                       color: "white",
          //                       border: "none",
          //                       borderRadius: "6px",
          //                     }}
          //                   >
          //                     ✕
          //                   </button>
          //                 </div>
          //               ))}
          //               <button
          //                 onClick={addJoinCondition}
          //                 style={{
          //                   padding: "8px 12px",
          //                   background: "#10b981",
          //                   color: "white",
          //                   border: "none",
          //                   borderRadius: "6px",
          //                   marginTop: "5px",
          //                 }}
          //               >
          //                 Add Condition
          //               </button>
          //             </div>
          //           )}

          //           <div style={{ marginTop: "15px" }}>
          //             <label
          //               style={{
          //                 display: "block",
          //                 marginBottom: "6px",
          //                 fontSize: "14px",
          //                 fontWeight: 500,
          //                 color: "#334155",
          //               }}
          //             >
          //               WHERE Clause (Optional)
          //             </label>
          //             <textarea
          //               value={mergeConfig.whereClause || ""}
          //               onChange={(e) =>
          //                 setMergeConfig((prev) => ({
          //                   ...prev,
          //                   whereClause: e.target.value,
          //                 }))
          //               }
          //               placeholder="Enter WHERE clause (e.g., LENGTH(kks_ext_code) = 3 AND system_status_class = 'ACTIVE')"
          //               style={{
          //                 width: "100%",
          //                 minHeight: "80px",
          //                 padding: "10px",
          //                 borderRadius: "6px",
          //                 border: "1px solid #cbd5e1",
          //                 fontFamily: "monospace",
          //                 fontSize: "13px",
          //                 backgroundColor: "#fff",
          //                 color: "#334155",
          //               }}
          //             />
          //             <div
          //               style={{
          //                 fontSize: "12px",
          //                 color: "#64748b",
          //                 marginTop: "5px",
          //               }}
          //             >
          //               Optional: Add custom WHERE conditions for the source
          //               query.
          //             </div>
          //           </div>
          //         </div>
          //       </div>
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           WHEN MATCHED Updates
          //         </label>
          //         <div
          //           style={{
          //             border: "1px solid #cbd5e1",
          //             borderRadius: "6px",
          //             padding: "10px",
          //             maxHeight: "150px",
          //             overflowY: "auto",
          //             backgroundColor: "#fff",
          //           }}
          //         >
          //           {availableFields.length > 0 ? (
          //             <>
          //               <label
          //                 style={{ display: "block", marginBottom: "5px" }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={
          //                     availableFields.every((field) =>
          //                       mergeConfig.matchedUpdates.includes(field)
          //                     ) &&
          //                     mergeConfig.matchedUpdates.includes(
          //                       "update_at"
          //                     ) &&
          //                     mergeConfig.matchedUpdates.includes("process_id")
          //                   }
          //                   onChange={(e) => {
          //                     const allFields = [
          //                       ...availableFields,
          //                       "update_at",
          //                       "process_id",
          //                     ];
          //                     setMergeConfig((prev) => ({
          //                       ...prev,
          //                       matchedUpdates: e.target.checked
          //                         ? allFields
          //                         : [],
          //                     }));
          //                   }}
          //                 />{" "}
          //                 Select All
          //               </label>
          //               {availableFields.map((field, index) => (
          //                 <div
          //                   key={index}
          //                   style={{
          //                     marginBottom: "5px",
          //                     display: "flex",
          //                     alignItems: "center",
          //                     gap: "10px",
          //                   }}
          //                 >
          //                   <input
          //                     type="checkbox"
          //                     checked={mergeConfig.matchedUpdates.includes(
          //                       field
          //                     )}
          //                     onChange={() =>
          //                       handleToggleField("matchedUpdates", field)
          //                     }
          //                   />{" "}
          //                   <span>
          //                     target.{field} = source.{field}
          //                   </span>
          //                   <input
          //                     value={customValues.matchedUpdates[field] || ""}
          //                     onChange={(e) =>
          //                       handleCustomValueChange(
          //                         "matchedUpdates",
          //                         field,
          //                         e.target.value
          //                       )
          //                     }
          //                     placeholder="Custom Value"
          //                     style={{
          //                       padding: "6px",
          //                       borderRadius: "6px",
          //                       border: "1px solid #cbd5e1",
          //                       flex: 1,
          //                     }}
          //                   />
          //                 </div>
          //               ))}
          //               <div
          //                 style={{
          //                   marginBottom: "5px",
          //                   display: "flex",
          //                   alignItems: "center",
          //                   gap: "10px",
          //                 }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={mergeConfig.matchedUpdates.includes(
          //                     "update_at"
          //                   )}
          //                   onChange={() =>
          //                     handleToggleField("matchedUpdates", "update_at")
          //                   }
          //                 />{" "}
          //                 <span>update_at = CURRENT_TIMESTAMP()</span>
          //                 <input
          //                   value={
          //                     customValues.matchedUpdates["update_at"] || ""
          //                   }
          //                   onChange={(e) =>
          //                     handleCustomValueChange(
          //                       "matchedUpdates",
          //                       "update_at",
          //                       e.target.value
          //                     )
          //                   }
          //                   placeholder="Custom Value"
          //                   style={{
          //                     padding: "6px",
          //                     borderRadius: "6px",
          //                     border: "1px solid #cbd5e1",
          //                     flex: 1,
          //                   }}
          //                 />
          //               </div>
          //               <div
          //                 style={{
          //                   marginBottom: "5px",
          //                   display: "flex",
          //                   alignItems: "center",
          //                   gap: "10px",
          //                 }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={mergeConfig.matchedUpdates.includes(
          //                     "process_id"
          //                   )}
          //                   onChange={() =>
          //                     handleToggleField("matchedUpdates", "process_id")
          //                   }
          //                 />{" "}
          //                 <span>process_id = '{processId}'</span>
          //                 <input
          //                   value={
          //                     customValues.matchedUpdates["process_id"] || ""
          //                   }
          //                   onChange={(e) =>
          //                     handleCustomValueChange(
          //                       "matchedUpdates",
          //                       "process_id",
          //                       e.target.value
          //                     )
          //                   }
          //                   placeholder="Custom Value"
          //                   style={{
          //                     padding: "6px",
          //                     borderRadius: "6px",
          //                     border: "1px solid #cbd5e1",
          //                     flex: 1,
          //                   }}
          //                 />
          //               </div>
          //             </>
          //           ) : (
          //             <div style={{ color: "#ef4444", fontSize: "12px" }}>
          //               No fields available. Connect an input node to enable
          //               field selection.
          //             </div>
          //           )}
          //         </div>
          //       </div>
          //       {/* WHEN NOT MATCHED Inserts */}
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           WHEN NOT MATCHED Inserts
          //         </label>
          //         <div
          //           style={{
          //             border: "1px solid #cbd5e1",
          //             borderRadius: "6px",
          //             padding: "10px",
          //             maxHeight: "150px",
          //             overflowY: "auto",
          //             backgroundColor: "#fff",
          //           }}
          //         >
          //           {availableFields.length > 0 ? (
          //             <>
          //               <label
          //                 style={{ display: "block", marginBottom: "5px" }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={
          //                     availableFields.every((field) =>
          //                       mergeConfig.notMatchedInserts.includes(field)
          //                     ) &&
          //                     mergeConfig.notMatchedInserts.includes(
          //                       "create_at"
          //                     ) &&
          //                     mergeConfig.notMatchedInserts.includes(
          //                       "process_at"
          //                     ) &&
          //                     mergeConfig.notMatchedInserts.includes(
          //                       "process_id"
          //                     )
          //                   }
          //                   onChange={(e) => {
          //                     const allFields = [
          //                       ...availableFields,
          //                       "create_at",
          //                       "process_at",
          //                       "process_id",
          //                     ];
          //                     setMergeConfig((prev) => ({
          //                       ...prev,
          //                       notMatchedInserts: e.target.checked
          //                         ? allFields
          //                         : [],
          //                     }));
          //                   }}
          //                 />{" "}
          //                 Select All
          //               </label>
          //               {availableFields.map((field, index) => (
          //                 <div
          //                   key={index}
          //                   style={{
          //                     marginBottom: "5px",
          //                     display: "flex",
          //                     alignItems: "center",
          //                     gap: "10px",
          //                   }}
          //                 >
          //                   <input
          //                     type="checkbox"
          //                     checked={mergeConfig.notMatchedInserts.includes(
          //                       field
          //                     )}
          //                     onChange={() =>
          //                       handleToggleField("notMatchedInserts", field)
          //                     }
          //                   />{" "}
          //                   <span>{field}</span>
          //                   <input
          //                     value={
          //                       customValues.notMatchedInserts[field] || ""
          //                     }
          //                     onChange={(e) =>
          //                       handleCustomValueChange(
          //                         "notMatchedInserts",
          //                         field,
          //                         e.target.value
          //                       )
          //                     }
          //                     placeholder="Custom Value"
          //                     style={{
          //                       padding: "6px",
          //                       borderRadius: "6px",
          //                       border: "1px solid #cbd5e1",
          //                       flex: 1,
          //                     }}
          //                   />
          //                 </div>
          //               ))}
          //               <div
          //                 style={{
          //                   marginBottom: "5px",
          //                   display: "flex",
          //                   alignItems: "center",
          //                   gap: "10px",
          //                 }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={mergeConfig.notMatchedInserts.includes(
          //                     "create_at"
          //                   )}
          //                   onChange={() =>
          //                     handleToggleField(
          //                       "notMatchedInserts",
          //                       "create_at"
          //                     )
          //                   }
          //                 />{" "}
          //                 <span>create_at = CURRENT_TIMESTAMP()</span>
          //                 <input
          //                   value={
          //                     customValues.notMatchedInserts["create_at"] || ""
          //                   }
          //                   onChange={(e) =>
          //                     handleCustomValueChange(
          //                       "notMatchedInserts",
          //                       "create_at",
          //                       e.target.value
          //                     )
          //                   }
          //                   placeholder="Custom Value"
          //                   style={{
          //                     padding: "6px",
          //                     borderRadius: "6px",
          //                     border: "1px solid #cbd5e1",
          //                     flex: 1,
          //                   }}
          //                 />
          //               </div>
          //               <div
          //                 style={{
          //                   marginBottom: "5px",
          //                   display: "flex",
          //                   alignItems: "center",
          //                   gap: "10px",
          //                 }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={mergeConfig.notMatchedInserts.includes(
          //                     "process_at"
          //                   )}
          //                   onChange={() =>
          //                     handleToggleField(
          //                       "notMatchedInserts",
          //                       "process_at"
          //                     )
          //                   }
          //                 />{" "}
          //                 <span>process_at = CURRENT_TIMESTAMP()</span>
          //                 <input
          //                   value={
          //                     customValues.notMatchedInserts["process_at"] || ""
          //                   }
          //                   onChange={(e) =>
          //                     handleCustomValueChange(
          //                       "notMatchedInserts",
          //                       "process_at",
          //                       e.target.value
          //                     )
          //                   }
          //                   placeholder="Custom Value"
          //                   style={{
          //                     padding: "6px",
          //                     borderRadius: "6px",
          //                     border: "1px solid #cbd5e1",
          //                     flex: 1,
          //                   }}
          //                 />
          //               </div>
          //               <div
          //                 style={{
          //                   marginBottom: "5px",
          //                   display: "flex",
          //                   alignItems: "center",
          //                   gap: "10px",
          //                 }}
          //               >
          //                 <input
          //                   type="checkbox"
          //                   checked={mergeConfig.notMatchedInserts.includes(
          //                     "process_id"
          //                   )}
          //                   onChange={() =>
          //                     handleToggleField(
          //                       "notMatchedInserts",
          //                       "process_id"
          //                     )
          //                   }
          //                 />{" "}
          //                 <span>process_id = '{processId}'</span>
          //                 <input
          //                   value={
          //                     customValues.notMatchedInserts["process_id"] || ""
          //                   }
          //                   onChange={(e) =>
          //                     handleCustomValueChange(
          //                       "notMatchedInserts",
          //                       "process_id",
          //                       e.target.value
          //                     )
          //                   }
          //                   placeholder="Custom Value"
          //                   style={{
          //                     padding: "6px",
          //                     borderRadius: "6px",
          //                     border: "1px solid #cbd5e1",
          //                     flex: 1,
          //                   }}
          //                 />
          //               </div>
          //             </>
          //           ) : (
          //             <div style={{ color: "#ef4444", fontSize: "12px" }}>
          //               No fields available. Connect an input node to enable
          //               field selection.
          //             </div>
          //           )}
          //         </div>
          //       </div>
          //       {/* Preview Merge Query */}
          //       <div>
          //         <label
          //           style={{
          //             display: "block",
          //             marginBottom: "6px",
          //             fontSize: "14px",
          //             fontWeight: 500,
          //             color: "#334155",
          //           }}
          //         >
          //           Preview Merge Query
          //         </label>
          //         <textarea
          //           value={generateMergeQuery()}
          //           readOnly
          //           style={{
          //             width: "100%",
          //             padding: "10px",
          //             borderRadius: "6px",
          //             border: "1px solid #cbd5e1",
          //             fontSize: "14px",
          //             minHeight: "150px",
          //             background: "#f1f5f9",
          //           }}
          //         />
          //       </div>
          //       {/* Save/Cancel Buttons */}
          //       <div style={{ display: "flex", gap: 10 }}>
          //         <button
          //           onClick={saveMergeConfig}
          //           style={{
          //             padding: "10px 20px",
          //             background: "#10b981",
          //             color: "white",
          //             border: "none",
          //             borderRadius: "6px",
          //             cursor: "pointer",
          //             fontWeight: 500,
          //           }}
          //         >
          //           Save
          //         </button>
          //         <button
          //           onClick={() => setIsModalOpen(false)}
          //           style={{
          //             padding: "10px 20px",
          //             background: "#f1f5f9",
          //             border: "1px solid #cbd5e1",
          //             borderRadius: "6px",
          //             cursor: "pointer",
          //             fontWeight: 500,
          //           }}
          //         >
          //           Cancel
          //         </button>
          //       </div>
          //     </div>
          //   </div>
          // </>
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
      default:
        return <p>No modal for this type.</p>;
    }
  };

  const saveNodeData = () => {
    if (selectedNode) {
      const nodeData = { inputCells };

      // Save mapping rules and Snowpipe config for Snowpipe nodes
      if (selectedNode.data.nodeType === "Snowpipe") {
        nodeData.mappingRules = mappingRules;
        nodeData.snowpipeConfig = snowpipeConfig;
      }

      // Save validation config for validation nodes
      if (selectedNode.data.nodeType === "validation") {
        nodeData.validationConfig = validationConfig;
      }

      updateNodeData(selectedNode.id, nodeData);
    }
    setIsModalOpen(false);
  };

  const handleGenerateCode = async () => {
    if (!nodes.length) {
      setError("Please add at least one node to the flow");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Find the Snowpipe node
      const snowpipeNode = nodes.find(
        (node) => node.data.nodeType === "Snowpipe"
      );

      console.log(snowpipeNode);
      if (!snowpipeNode) {
        throw new Error("Please add a Snowpipe node to the flow");
      }

      // Get the Snowpipe configuration
      const snowpipeConfig = snowpipeNode.data.snowpipeConfig;
      const mappingRules = snowpipeNode.data.mappingRules;
      if (!snowpipeConfig) {
        throw new Error("Please configure the Snowpipe node");
      }

      // Find validation nodes
      const validationNodes = nodes.filter(
        (node) => node.data.nodeType === "validation"
      );

      // Extract validation configurations
      const validations = validationNodes
        .map((node) => {
          const config = node.data.validationConfig;
          if (config.selectedProcedure === "custom") {
            return {
              type: "custom",
              procedureCall: config.customProcedureCall,
            };
          } else {
            const selectedProc = validationSubprocedures.find(
              (p) => p.procedure === config.selectedProcedure
            );

            if (selectedProc) {
              const params = {};
              selectedProc.parameters.forEach((param) => {
                params[param.name] = config.parameters[param.name] || "";
              });

              return {
                type: "predefined",
                procedure: config.selectedProcedure,
                parameters: params,
              };
            }
            return null;
          }
        })
        .filter(Boolean);

      // Log validations for debugging
      console.log("Validation nodes:", validationNodes);
      console.log("Validation configurations:", validations);

      const payload = {
        process_id: snowpipeConfig.process_id,
        output_table_name: snowpipeConfig.output_table_name,
        output_table_zone: snowpipeConfig.output_table_zone,
        file_format: snowpipeConfig.file_format,
        pattern_type: snowpipeConfig.pattern_type,
        stage_name: snowpipeConfig.stage_name,
        mapping: mappingRules, // This should be an array of mapping objects
        validations: validations, // Add validations to the payload
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/generate-pipe-with-json/",
        payload
      );
      // Send data to backend
      // const response = await axios.post(
      //   "http://127.0.0.1:8000/generate-pipe-with-json/",
      //   snowpipeConfig
      // );

      // Handle the response
      if (response.data.pipe) {
        // Pass the generated code to the parent component
        if (onCodeGenerated) {
          onCodeGenerated({
            name: `${snowpipeConfig.output_table_name || "snowpipe"}.sql`,
            content: response.data.pipe,
          });
        }
      }
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
                  <span>✨</span>
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
    </div>
  );
}

// Helper function to get color based on node type
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

export default function DrawProcess({ onCodeGenerated }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas onCodeGenerated={onCodeGenerated} />
    </ReactFlowProvider>
  );
}
