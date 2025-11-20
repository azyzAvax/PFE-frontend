import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "../css/DeploymentManager.css";

export default function DeploymentManager({ generatedFiles }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [expandedFileIndex, setExpandedFileIndex] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentName, setDeploymentName] = useState("");
  const [deploymentDescription, setDeploymentDescription] = useState("");
  const [workItems, setWorkItems] = useState([]);
  const [selectedWorkItem, setSelectedWorkItem] = useState("");
  const [workItemSearch, setWorkItemSearch] = useState("");
  const [isLoadingWorkItems, setIsLoadingWorkItems] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showWorkItemDropdown, setShowWorkItemDropdown] = useState(false);
  const workItemContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        workItemContainerRef.current &&
        !workItemContainerRef.current.contains(event.target)
      ) {
        setShowWorkItemDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search work items with debouncing
  const searchWorkItems = async (query) => {
    if (!query.trim()) {
      setWorkItems([]);
      setShowWorkItemDropdown(false);
      return;
    }

    setIsLoadingWorkItems(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/search-work-items/?query=${encodeURIComponent(
          query.trim()
        )}&limit=10`
      );
      setWorkItems(response.data.work_items || []);
      setShowWorkItemDropdown(true);
    } catch (error) {
      console.error("Failed to search work items:", error);
      setWorkItems([]);
      setShowWorkItemDropdown(false);
    } finally {
      setIsLoadingWorkItems(false);
    }
  };

  const handleWorkItemSearch = (e) => {
    const query = e.target.value;
    setWorkItemSearch(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debouncing
    const newTimeout = setTimeout(() => {
      searchWorkItems(query);
    }, 300);

    setSearchTimeout(newTimeout);
  };

  const handleWorkItemSelect = (workItem) => {
    setSelectedWorkItem(workItem.id.toString());
    setWorkItemSearch(`#${workItem.id} ${workItem.title}`);
    setShowWorkItemDropdown(false);
  };

  const clearWorkItemSelection = () => {
    setSelectedWorkItem("");
    setWorkItemSearch("");
    setWorkItems([]);
    setShowWorkItemDropdown(false);
  };

  const toggleFileSelection = (fileIndex) => {
    setSelectedFiles((prev) => {
      if (prev.includes(fileIndex)) {
        return prev.filter((idx) => idx !== fileIndex);
      } else {
        return [...prev, fileIndex];
      }
    });
  };

  const toggleExpand = (index) => {
    setExpandedFileIndex(expandedFileIndex === index ? null : index);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === generatedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(generatedFiles.map((_, index) => index));
    }
  };

  const handleDeploySelected = async () => {
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
    selectedFiles.forEach((fileIndex) => {
      const file = generatedFiles[fileIndex];
      formData.append(
        "files",
        new Blob([file.content], { type: "text/plain" }),
        file.name
      );
    });

    // Add branch name and description
    formData.append(
      "branch_name",
      `deploy-${deploymentName.replace(/[^a-zA-Z0-9-]/g, "-")}-${Date.now()}`
    );
    formData.append("description", deploymentDescription);
    formData.append("author", "your_name_or_email");
    formData.append("context_filter", "default_context");
    formData.append("project_env", "dev"); // or "prod", depending
    formData.append("project_name", "my_project");
    formData.append("stage", "test");
    // Add work item ID if selected
    if (selectedWorkItem) {
      formData.append("work_item_id", selectedWorkItem);
    }

    try {
      const endpoint = selectedWorkItem
        ? "http://127.0.0.1:8000/deploy-multiple-to-azure-with-workitem/"
        : "http://127.0.0.1:8000/deploy-multiple-to-azure/";

      const res = await axios.post(endpoint, formData);
      console.log("Deploy response:", res);

      let successMessage =
        "Deployed! PR created at: " + res.data.pull_request_url;
      if (selectedWorkItem && res.data.work_item_linked) {
        successMessage += `\nWork item #${res.data.work_item_id} has been linked to the PR.`;
      }

      alert(successMessage);
    } catch (err) {
      console.error(err);
      alert(
        "Deployment failed: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadFile = (file) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
  };

  return (
    <div className="deployment-manager">
      <div className="deployment-header">
        <h2>
          <span role="img" aria-label="rocket">
            🚀
          </span>{" "}
          Deployment Manager
        </h2>
        <p>
          Select files to include in your deployment PR and optionally link to a
          work item
        </p>
      </div>

      {generatedFiles.length === 0 ? (
        <div className="no-files-message">
          <div className="emoji">📋</div>
          <p className="title">No files available for deployment</p>
          <p className="description">
            Generate code files first using the "Generate Code" tab, then come
            back to deploy them.
          </p>
        </div>
      ) : (
        <div className="deployment-layout">
          <div className="deployment-controls">
            <div className="deployment-form">
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
              <div className="form-group">
                <label htmlFor="deployment-description">
                  Description (optional)
                </label>
                <textarea
                  id="deployment-description"
                  value={deploymentDescription}
                  onChange={(e) => setDeploymentDescription(e.target.value)}
                  placeholder="Describe the changes in this deployment"
                  rows={3}
                />
              </div>

              {/* Work Item Selection */}
              <div className="form-group">
                <label htmlFor="work-item-search">
                  <span className="work-item-icon">🔗</span>
                  Link to Work Item (optional)
                </label>
                <div className="work-item-container" ref={workItemContainerRef}>
                  <div className="work-item-search-wrapper">
                    <input
                      id="work-item-search"
                      type="text"
                      value={workItemSearch}
                      onChange={handleWorkItemSearch}
                      onFocus={() =>
                        workItems.length > 0 && setShowWorkItemDropdown(true)
                      }
                      placeholder="Search work items by ID or title..."
                      className="work-item-search"
                    />
                    {selectedWorkItem && (
                      <button
                        type="button"
                        className="clear-work-item-btn"
                        onClick={clearWorkItemSelection}
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    )}
                    {isLoadingWorkItems && (
                      <div className="work-item-loading-indicator">🔄</div>
                    )}
                  </div>

                  {/* Dropdown with search results */}
                  {showWorkItemDropdown && workItems.length > 0 && (
                    <div className="work-item-dropdown">
                      {workItems.map((item) => (
                        <div
                          key={item.id}
                          className="work-item-option"
                          onClick={() => handleWorkItemSelect(item)}
                        >
                          <div className="work-item-option-header">
                            <span className="work-item-id">#{item.id}</span>
                            <span className="work-item-type">{item.type}</span>
                            {item.project && (
                              <span className="work-item-project">
                                {item.project}
                              </span>
                            )}
                          </div>
                          <div className="work-item-title">{item.title}</div>
                          <div className="work-item-details">
                            <span className="work-item-state">
                              {item.state}
                            </span>
                            <span className="work-item-assigned">
                              Assigned to: {item.assignedTo}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected work item info */}
                  {selectedWorkItem && (
                    <div className="work-item-selected-info">
                      <div className="selected-item-header">
                        <strong>Linked Work Item:</strong>
                        <button
                          type="button"
                          className="remove-link-btn"
                          onClick={clearWorkItemSelection}
                        >
                          Remove Link
                        </button>
                      </div>
                      {(() => {
                        const selectedItem = workItems.find(
                          (item) => item.id.toString() === selectedWorkItem
                        );
                        return selectedItem ? (
                          <div className="selected-item-details">
                            <div className="item-id-title">
                              <span className="selected-id">
                                #{selectedItem.id}
                              </span>
                              <span className="selected-title">
                                {selectedItem.title}
                              </span>
                            </div>
                            <div className="item-meta">
                              <span className="meta-item">
                                <strong>Type:</strong> {selectedItem.type}
                              </span>
                              <span className="meta-item">
                                <strong>State:</strong> {selectedItem.state}
                              </span>
                              {selectedItem.project && (
                                <span className="meta-item">
                                  <strong>Project:</strong>{" "}
                                  {selectedItem.project}
                                </span>
                              )}
                              <span className="meta-item">
                                <strong>Assigned to:</strong>{" "}
                                {selectedItem.assignedTo}
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="select-all-btn" onClick={handleSelectAll}>
                {selectedFiles.length === generatedFiles.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                className={`deploy-btn ${
                  selectedWorkItem ? "with-work-item" : ""
                }`}
                onClick={handleDeploySelected}
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
                    <span role="img" aria-label="rocket">
                      🚀
                    </span>
                    Deploy Selected ({selectedFiles.length})
                    {selectedWorkItem && " with Work Item"}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="files-list">
            <h3 className="files-list-header">Available Files</h3>
            {generatedFiles.map((file, index) => (
              <div
                key={index}
                className={`file-item ${
                  selectedFiles.includes(index) ? "selected" : ""
                }`}
              >
                <div className="file-header">
                  <div className="file-info">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(index)}
                      onChange={() => toggleFileSelection(index)}
                    />
                    <div className="file-icon">
                      {file.name.endsWith(".sql")
                        ? "📜"
                        : file.name.endsWith(".py")
                        ? "🐍"
                        : file.name.endsWith(".json")
                        ? "📋"
                        : "📄"}
                    </div>
                    <h3 className="file-name">{file.name}</h3>
                  </div>

                  <div className="file-actions">
                    <button
                      className="view-btn"
                      onClick={() => toggleExpand(index)}
                    >
                      <span>{expandedFileIndex === index ? "👁️" : "👁️"}</span>
                      {expandedFileIndex === index ? "Hide" : "View"}
                    </button>
                    <button
                      className="download-btn"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <span>⬇️</span>
                      Download
                    </button>
                  </div>
                </div>

                {expandedFileIndex === index && (
                  <div className="file-content">
                    <Editor
                      height="300px"
                      language={
                        file.name.endsWith(".sql")
                          ? "sql"
                          : file.name.endsWith(".py")
                          ? "python"
                          : file.name.endsWith(".json")
                          ? "json"
                          : "plaintext"
                      }
                      value={file.content}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        lineNumbers: "on",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
