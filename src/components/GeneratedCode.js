import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "../css/GeneratedCode.css";
import axios from "axios";

export default function GeneratedCode({
  generatedFiles,
  handleDownloadAll,
  handleDownloadFile,
}) {
  const [expandedFileIndex, setExpandedFileIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentName, setDeploymentName] = useState("");
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

  useEffect(() => {
  if (generatedFiles.length > 0) {
    setEditorContent(generatedFiles[0].content || ""); // Sync with the first file's content
  } else {
    setEditorContent("");
  }
}, [generatedFiles]);

  const toggleExpand = (index) => {
    setExpandedFileIndex(expandedFileIndex === index ? null : index);
  };

  const toggleFileSelection = (index) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDeploy = async (file) => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([file.content], { type: "text/plain" }),
      file.name
    );
    formData.append("branch_name", `deploy-${Date.now()}`);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/deploy-to-azure/",
        formData
      );
      console.log("Deploy response:", res);
      alert("Deployed! PR created at: " + res.data.pull_request_url);
    } catch (err) {
      console.error(err);
      alert("Deployment failed.");
    }
  };

  const handleDeployMultiple = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file to deploy.");
      return;
    }

    if (!deploymentName.trim()) {
      alert("Please provide a name for this deployment.");
      return;
    }

    setIsDeploying(true);

    const formData = new FormData();

    // Add each selected file to the formData
    selectedFiles.forEach((index) => {
      const file = generatedFiles[index];
      formData.append(
        "files",
        new Blob([file.content], { type: "text/plain" }),
        file.name
      );
    });

    // Add branch name
    formData.append(
      "branch_name",
      `deploy-${deploymentName.replace(/[^a-zA-Z0-9-]/g, "-")}-${Date.now()}`
    );
    formData.append(
      "description",
      `Deployment of ${selectedFiles.length} files: ${selectedFiles
        .map((index) => generatedFiles[index].name)
        .join(", ")}`
    );

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/deploy-multiple-to-azure/",
        formData
      );
      console.log("Deploy response:", res);
      alert("Deployed! PR created at: " + res.data.pull_request_url);
      setShowDeploymentModal(false);
      setSelectedFiles([]);
      setDeploymentName("");
    } catch (err) {
      console.error(err);
      alert(
        "Deployment failed: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        backgroundColor: "#f8fafc",
        overflow: "auto",
        height: "100%",
      }}
    >
      {showDeploymentModal && (
        <div className="deployment-modal-overlay">
          <div className="deployment-modal">
            <div className="deployment-modal-header">
              <h3>Deploy Multiple Files</h3>
              <button
                className="close-button"
                onClick={() => setShowDeploymentModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="deployment-modal-body">
              <div className="form-group">
                <label htmlFor="deployment-name">Deployment Name</label>
                <input
                  id="deployment-name"
                  type="text"
                  value={deploymentName}
                  onChange={(e) => setDeploymentName(e.target.value)}
                  placeholder="e.g., new-snowpipe-implementation"
                />
              </div>

              <div className="selected-files">
                <h4>Selected Files ({selectedFiles.length})</h4>
                <ul>
                  {selectedFiles.map((index) => (
                    <li key={index}>
                      {generatedFiles[index].name}
                      <button
                        onClick={() => toggleFileSelection(index)}
                        className="remove-file-btn"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="deployment-modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowDeploymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="deploy-btn"
                onClick={handleDeployMultiple}
                disabled={
                  selectedFiles.length === 0 ||
                  isDeploying ||
                  !deploymentName.trim()
                }
              >
                {isDeploying ? (
                  <>
                    <span className="spinner"></span>
                    Deploying...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Deploy Files
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#1e293b",
            fontSize: "1.5rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📄</span>
          Generated Code
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {generatedFiles.length > 1 && selectedFiles.length > 0 && (
            <button
              onClick={() => setShowDeploymentModal(true)}
              style={{
                padding: "10px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(16,185,129,0.3)",
              }}
            >
              <span>🚀</span> Deploy Selected ({selectedFiles.length})
            </button>
          )}
          {generatedFiles.length > 1 && (
            <button
              onClick={handleDownloadAll}
              style={{
                padding: "10px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(59,130,246,0.3)",
              }}
            >
              <span>⬇️</span> Download All Files
            </button>
          )}
        </div>
      </div>

      {generatedFiles.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "50px 20px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            marginTop: "50px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📋</div>
          <p style={{ fontSize: "16px", marginBottom: "5px", fontWeight: 500 }}>
            No files generated yet
          </p>
          <p style={{ fontSize: "14px", maxWidth: "400px", lineHeight: 1.6 }}>
            Design your data pipeline workflow using the drawing canvas, then
            generate code to create your files.
          </p>
        </div>
      ): generatedFiles.length === 1 ? (
  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    }}
  >
    <div
      style={{
        padding: "15px 20px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "20px" }}>
          {generatedFiles[0].name.endsWith(".sql")
            ? "📜"
            : generatedFiles[0].name.endsWith(".py")
            ? "🐍"
            : generatedFiles[0].name.endsWith(".json")
            ? "📋"
            : "📄"}
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            color: "#334155",
          }}
        >
          {generatedFiles[0].name}
        </h3>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          style={{
            padding: "8px 12px",
            backgroundColor: isEditing ? "#f8fafc" : "#f1f5f9",
            color: isEditing ? "#3b82f6" : "#475569",
            border: isEditing ? "1px solid #3b82f6" : "1px solid #cbd5e1",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{isEditing ? "✓" : "✏️"}</span>
          {isEditing ? "Preview" : "Edit"}
        </button>

        <button
          onClick={() => handleDeploy(generatedFiles[0])}
          style={{
            padding: "8px 12px",
            backgroundColor: "#10b981",
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
          <span>🚀</span>
          Deploy
        </button>

        <button
          onClick={() => handleDownloadFile(generatedFiles[0])}
          style={{
            padding: "8px 12px",
            backgroundColor: "#3b82f6",
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
          <span>⬇️</span>
          Download
        </button>
      </div>
    </div>

    <div style={{ height: "500px" }}>
      {isEditing ? (
        <Editor
          height="100%"
          language="sql"
          value={editorContent}
          onChange={(value) => setEditorContent(value)}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
          }}
        />
      ) : (
        <pre
          style={{
            margin: 0,
            padding: "20px",
            background: "#1e293b",
            color: "#f8fafc",
            height: "100%",
            overflow: "auto",
            borderRadius: "0",
            fontSize: "14px",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {generatedFiles[0].content || "No content available"} {/* Use direct content as fallback */}
        </pre>
      )}
    </div>
  </div>
) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {generatedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#fff",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom:
                    expandedFileIndex === index ? "1px solid #e2e8f0" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(index)}
                    onChange={() => toggleFileSelection(index)}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ fontSize: "18px", color: "#64748b" }}>
                    {file.name.endsWith(".sql")
                      ? "📜"
                      : file.name.endsWith(".py")
                      ? "🐍"
                      : file.name.endsWith(".json")
                      ? "📋"
                      : "📄"}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#334155",
                    }}
                  >
                    {file.name}
                  </h3>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => toggleExpand(index)}
                    style={{
                      padding: "6px 10px",
                      backgroundColor:
                        expandedFileIndex === index ? "#e0f2fe" : "#f1f5f9",
                      color:
                        expandedFileIndex === index ? "#0284c7" : "#475569",
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
                    <span>{expandedFileIndex === index ? "👁️" : "👁️"}</span>
                    {expandedFileIndex === index ? "Hide" : "View"}
                  </button>

                  <button
                    onClick={() => handleDeploy(file)}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#10b981",
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
                    <span>🚀</span>
                    Deploy
                  </button>

                  <button
                    onClick={() => handleDownloadFile(file)}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#3b82f6",
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
                    <span>⬇️</span>
                    Download
                  </button>
                </div>
              </div>

              {expandedFileIndex === index && (
                <pre
                  style={{
                    margin: 0,
                    padding: "16px",
                    background: "#1e293b",
                    color: "#f8fafc",
                    overflow: "auto",
                    maxHeight: "300px",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  <code>{file.content}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
