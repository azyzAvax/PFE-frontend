import React, { useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import GeneratedCode from "../components/GeneratedCode";
import DeploymentManager from "../components/DeploymentManager";
import ProjectInitializer from "../components/ProjectInitializer";
import TestManager from "../components/TestManager";
import Tabs from "../components/Tabs";
import "../css/Dashboard.css";
import ProcessFlow from "../components/ProcessFlow";
import DrawProcess from "../components/DrawProcess";

import { useGeneratedFiles } from "../hooks/GeneratedFilesContext";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [objectType, setObjectType] = useState("TABLE");
  const [inputType, setInputType] = useState("file");
  const [fileName, setFileName] = useState("");
  const [inputSpecification, setInputSpecification] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [udfType, setUdfType] = useState("js");
  const [activeProject, setActiveProject] = useState(null);
  const { generatedFilesContext, setGeneratedFilesContext } =
    useGeneratedFiles();

  const handleDownloadAll = () => {
    if (generatedFiles.length === 0) {
      alert("No files to download.");
      return;
    }

    const zipContent = generatedFiles.map((file) => ({
      name: file.name,
      content: file.content,
    }));

    const zipBlob = new Blob(
      zipContent.map((file) => file.content),
      { type: "application/zip" }
    );
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated_files.zip";
    link.click();
  };

  const handleDownloadFile = (file) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/get-sheet-names/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Sheet Names from Backend:", response.data.sheet_names); // Debug log
        setSheetNames(response.data.sheet_names);
        setIsModalOpen(true);
      } catch (err) {
        setError("Failed to retrieve sheet names. Please try again.");
        console.error(err);
      }
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedSheets.length) {
      setError("Please select at least one sheet.");
      return;
    }

    setError("");
    setGeneratedFiles([]);
    setLoading(true);

    const formData = new FormData();
    const fileInput = document.getElementById("file-upload");
    if (!fileInput || !fileInput.files.length) {
      console.error("No file uploaded!");
      return;
    }

    if (objectType === "USP") {
      formData.append("file", fileInput.files[0]);
      formData.append("sheet_name", selectedSheets[0]);
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/generate-usp-from-sheet/",
          formData
        );

        setGeneratedFiles([
          {
            name: `${selectedSheets[0]}_usp.sql`,
            content: response.data.usp_template,
          },
        ]);
      } catch (err) {
        setError("Error generating USP.");
        console.error(err);
      }
    } else if (objectType === "PIPE") {
      formData.append("file", fileInput.files[0]);
      formData.append("sheet_name", selectedSheets[0]);
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/generate-pipe/",
          formData
        );

        setGeneratedFiles([
          {
            name: `${selectedSheets[0]}.sql`,
            content: response.data.pipe,
          },
        ]);
      } catch (err) {
        setError("Error generating USP.");
        console.error(err);
      }
    } else if (objectType === "UDF") {
      formData.append("file", fileInput.files[0]);
      console.log("Selected Sheet for UDF:", selectedSheets[0]); // Debug log
      formData.append("sheet_name", selectedSheets[0]);
      const endpoint =
        udfType === "js"
          ? "http://127.0.0.1:8000/generate-js-udf-from-sheet/"
          : "http://127.0.0.1:8000/generate-sql-udf-from-sheet/";

      try {
        const response = await axios.post(endpoint, formData);
        console.log("Full Response Data:", response.data); // Debug log
        let content = response.data.udf_template || ""; // Use udf_template as the primary source
        if (content.startsWith("```") && content.endsWith("```")) {
          content = content.split("\n").slice(1, -1).join("\n").trim();
        }
        const generatedFile = {
          name: `${selectedSheets[0]}_udf_${udfType}.sql`,
          content: content,
        };
        setGeneratedFiles([generatedFile]);
        console.log("Generated File Before Set:", [generatedFile]);
      } catch (err) {
        setError(`Error generating ${udfType.toUpperCase()} UDF.`);
        console.error(err);
      }
    } else {
      formData.append("file", fileInput.files[0]);
      formData.append("sheets", JSON.stringify(selectedSheets));
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/generate-ddl-from-design/",
          formData
        );
        console.log(response.data);
        const ddlFiles = response.data.ddls;

        setGeneratedFiles(
          ddlFiles.map((ddl, index) => ({
            name: `${selectedSheets[index]}_generated.sql`,
            content: ddl,
          }))
        );
      } catch (err) {
        setError("Error generating DDL.");
        console.error(err);
      }
    }

    setLoading(false);
  };

  const toggleSheetSelection = (sheetName) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName)
        ? prev.filter((name) => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleCodeGenerated = (file) => {
    setGeneratedFiles([file]);
  };

  const handleUpdateFile = (index, newContent) => {
    const updatedFiles = [...generatedFiles];
    updatedFiles[index].content = newContent;
    setGeneratedFiles(updatedFiles);
  };

  const renderInputSection = () => (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        flex: 1, // Allow this section to expand
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="input-type"
          style={{
            display: "block",
            marginBottom: "8px",
            color: "#475569",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Input Type
        </label>
        <select
          id="input-type"
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#f8fafc",
            fontSize: "14px",
            color: "#1e293b",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "30px",
          }}
        >
          <option value="file">File Upload</option>
          <option value="draw">Draw Process</option>
        </select>
      </div>

      {inputType === "draw" ? (
        <div
          className="draw-process-wrapper"
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
            height: "600px",
          }}
        >
          <DrawProcess
            onCodeGenerated={handleCodeGenerated}
            objectType={objectType}
          />
        </div>
      ) : inputType === "file" ? (
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="file-upload"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Upload Specification File
          </label>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "30px",
              borderRadius: "8px",
              border: "2px dashed #cbd5e1",
              backgroundColor: "#f8fafc",
              cursor: "pointer",
              marginBottom: "15px",
              textAlign: "center",
              height: "200px", // Fixed height for upload area
            }}
            onClick={() => document.getElementById("file-upload").click()}
          >
            <div style={{ fontSize: "32px", marginBottom: "15px" }}>📂</div>
            <p
              style={{ margin: "0 0 5px 0", fontWeight: 500, color: "#334155" }}
            >
              Click to upload a file
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Support for .xlsx and .xls files
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
          {objectType === "UDF" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="udf-type"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                UDF Type
              </label>
              <select
                id="udf-type"
                value={udfType}
                onChange={(e) => setUdfType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  fontSize: "14px",
                  color: "#1e293b",
                }}
              >
                <option value="js">JavaScript UDF</option>
                <option value="sql">SQL UDF</option>
              </select>
            </div>
          )}

          {fileName && (
            <div
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                padding: "10px 15px",
                borderRadius: "8px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "18px" }}>📎</span>
                <span style={{ wordBreak: "break-all" }}>{fileName}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(99,102,241,0.3)",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <span>📋</span>
                Select Sheets
              </button>
            </div>
          )}

          {fileName && (
            <div style={{ marginTop: "15px" }}>
              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  color: "#0c4a6e",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #bae6fd",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "16px" }}>ℹ️</span>
                  <span>
                    File ready! You can generate multiple object types from this
                    file.
                  </span>
                </div>
              </div>

              <button
                onClick={handleGenerateCode}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
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
                  width: "100%",
                  opacity: selectedSheets.length === 0 ? 0.5 : 1,
                }}
                disabled={selectedSheets.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <svg
                      style={{
                        width: "16px",
                        height: "16px",
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
                    Generate {objectType}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="text-input"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {`${objectType} Specification`}
          </label>
          <textarea
            id="text-input"
            placeholder={`Enter your ${objectType} requirements here...`}
            value={inputSpecification}
            onChange={(e) => setInputSpecification(e.target.value)}
            style={{
              width: "100%",
              minHeight: "200px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              fontSize: "14px",
              color: "#1e293b",
              resize: "vertical",
              fontFamily: "monospace",
            }}
          />

          {inputType === "text" && inputSpecification.trim() !== "" && (
            <button
              onClick={() => {
                alert("Text input generation not implemented yet");
              }}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                padding: "12px 20px",
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
                width: "100%",
                marginTop: "15px",
              }}
            >
              <span>✨</span>
              Generate Code
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f1f5f9",
        width: "100%",
      }}
    >
      <Header />
      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Init project", icon: "🏗️" },
          { label: "Generate Code", icon: "✨" },
          { label: "Test", icon: "🧪" },
          { label: "Deploy", icon: "🚀" },
        ]}
      />
      {activeTab === 0 && (
        <div
          style={{
            display: "flex",
            flex: 1,
            height: "calc(100vh - 110px)",
            width: "100%",
          }}
        >
          <ProjectInitializer
            onProjectInitialized={(project) => {
              setActiveProject(project);
              if (!activeProject) {
                setActiveTab(1);
              }
            }}
          />
        </div>
      )}
      {activeTab === 1 && (
        <div
          style={{
            display: "flex",
            padding: "20px",
            gap: "20px", // Maintains consistent spacing between columns
            flex: 1,
            height: "calc(100vh - 110px)",
            flexDirection: inputType === "draw" ? "column" : "row",
            width: "100%", // Ensures the container uses full width
          }}
        >
          {inputType === "draw" ? (
            <>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  border: "1px solid #e2e8f0",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: "#1e293b",
                      fontSize: "18px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>⚙️</span>
                    Configuration
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <label
                        htmlFor="input-type"
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        Input Type
                      </label>
                      <select
                        id="input-type"
                        value={inputType}
                        onChange={(e) => setInputType(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#f8fafc",
                          fontSize: "14px",
                          color: "#1e293b",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          paddingRight: "30px",
                        }}
                      >
                        <option value="file">File Upload</option>
                        <option value="draw">Draw Process</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="object-type"
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        Object Type
                      </label>
                      <select
                        id="object-type"
                        value={objectType}
                        onChange={(e) => setObjectType(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#f8fafc",
                          fontSize: "14px",
                          color: "#1e293b",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          paddingRight: "30px",
                        }}
                      >
                        <option value="TABLE">TABLE</option>
                        <option value="UDF">UDF</option>
                        <option value="PIPE">PIPE</option>
                        <option value="USP">USP</option>
                      </select>
                    </div>
                  </div>
                </div>
                {error && (
                  <div
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      padding: "12px 15px",
                      borderRadius: "8px",
                      marginTop: "15px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>⚠️</span>
                    {error}
                  </div>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  height: "calc(100vh - 240px)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                }}
              >
                <DrawProcess
                  onCodeGenerated={handleCodeGenerated}
                  objectType={objectType}
                />
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  flex: 1, // Removed maxWidth to allow full expansion
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h2
                    style={{
                      margin: "0 0 20px 0",
                      color: "#1e293b",
                      fontSize: "18px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>⚙️</span>
                    Configuration
                  </h2>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="object-type"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#475569",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Object Type
                    </label>
                    <select
                      id="object-type"
                      value={objectType}
                      onChange={(e) => setObjectType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#f8fafc",
                        fontSize: "14px",
                        color: "#1e293b",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: "30px",
                      }}
                    >
                      <option value="TABLE">TABLE</option>
                      <option value="UDF">UDF</option>
                      <option value="PIPE">PIPE</option>
                      <option value="USP">USP</option>
                    </select>
                  </div>
                </div>
                {renderInputSection()}
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                <GeneratedCode
                  generatedFiles={generatedFiles}
                  handleDownloadAll={handleDownloadAll}
                  handleDownloadFile={handleDownloadFile}
                  onUpdateFile={handleUpdateFile}
                />
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === 2 && (
        <div
          style={{
            display: "flex",
            flex: 1,
            height: "calc(100vh - 110px)",
            width: "100%",
          }}
        >
          <TestManager />
        </div>
      )}
      {activeTab === 3 && (
        <div
          style={{
            display: "flex",
            flex: 1,
            height: "calc(100vh - 110px)",
            width: "100%",
          }}
        >
          <DeploymentManager generatedFiles={generatedFiles} />
        </div>
      )}
      {activeTab === 4 && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "15px" }}>📊</div>
          <h3 style={{ color: "#334155", margin: "0 0 10px 0" }}>
            Monitoring Dashboard Coming Soon
          </h3>
          <p>
            Track performance metrics and execution logs for your Snowflake
            objects.
          </p>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "25px",
              width: "500px",
              maxWidth: "90%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "0 0 20px 0",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "15px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1e293b",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>📋</span>
                Generate {objectType} from Sheets
              </h3>
              {generatedFiles.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>✅</span>
                  {generatedFiles.length} file(s) generated
                </div>
              )}
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "15px",
                fontSize: "14px",
                color: "#475569",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>📄</span>
                <strong>File:</strong> {fileName}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "16px" }}>⚙️</span>
                <strong>Object Type:</strong> {objectType}
                {objectType === "UDF" && (
                  <span
                    style={{
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      marginLeft: "8px",
                    }}
                  >
                    {udfType.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {sheetNames.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                No sheets found in this file.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginBottom: "20px",
                  padding: "5px",
                }}
              >
                {sheetNames.map((sheetName) => (
                  <div
                    key={sheetName}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      backgroundColor: selectedSheets.includes(sheetName)
                        ? "#f0f9ff"
                        : "#f8fafc",
                      border: `1px solid ${
                        selectedSheets.includes(sheetName)
                          ? "#bae6fd"
                          : "#e2e8f0"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleSheetSelection(sheetName)}
                  >
                    <input
                      type="checkbox"
                      id={`sheet-${sheetName}`}
                      checked={selectedSheets.includes(sheetName)}
                      onChange={() => {}}
                      style={{
                        marginRight: "10px",
                        width: "18px",
                        height: "18px",
                        accentColor: "#3b82f6",
                      }}
                    />
                    <label
                      htmlFor={`sheet-${sheetName}`}
                      style={{
                        cursor: "pointer",
                        fontSize: "14px",
                        color: selectedSheets.includes(sheetName)
                          ? "#0369a1"
                          : "#334155",
                        fontWeight: selectedSheets.includes(sheetName)
                          ? 500
                          : 400,
                        flexGrow: 1,
                      }}
                    >
                      {sheetName}
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSheets([]);
                  setFileName("");
                  setGeneratedFiles([]);
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>❌</span>
                Close & Reset
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(59,130,246,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                disabled={selectedSheets.length === 0}
              >
                <span>✓</span>
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
