import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DataGrid } from "react-data-grid";
import "../css/TestManager.css";

export default function TestManager() {
  const [testType, setTestType] = useState("usp"); // "usp" or "pipe"
  const [schemaName, setSchemaName] = useState("");
  const [objectName, setObjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [fileName, setFileName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleRunTest = async () => {
    if (!schemaName.trim()) {
      setError("Schema name is required");
      return;
    }

    if (!objectName.trim()) {
      setError("Object name is required");
      return;
    }

    setError("");
    setIsLoading(true);
    setTestStatus(null);
    setReportData(null);
    setDownloadUrl(null);

    try {
      const endpoint =
        testType === "usp"
          ? "http://127.0.0.1:8000/generate-test-report"
          : "http://127.0.0.1:8000/test-snowpipe";

      const requestData =
        testType === "usp"
          ? { procedure_name: objectName, procedure_schema: schemaName }
          : { pipe_name: objectName, pipe_schema: schemaName };

      // Make the API call
      const response = await axios.post(endpoint, requestData, {
        responseType: "blob", // Important for handling file downloads
      });

      // Create a file name for the report
      const generatedFileName =
        testType === "usp"
          ? `${schemaName}_${objectName}_unit_test_report.xlsx`
          : `${schemaName}_${objectName}_pipe_test_report.xlsx`;

      setFileName(generatedFileName);

      // Process the Excel file for display
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Process all sheets in the workbook
          const sheets = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Extract headers (first row) and rows
            const headers = jsonData[0] || [];
            const rows = jsonData.slice(1).map((row, idx) => {
              const rowData = { id: idx };
              headers.forEach((header, index) => {
                rowData[header] = row[index] !== undefined ? row[index] : "";
              });
              return rowData;
            });

            return {
              name: sheetName,
              headers: headers.map((h) => ({ key: h, name: h })),
              rows,
            };
          });

          setReportData(sheets);
          setActiveSheet(0);

          setTestStatus({
            success: true,
            message: `Test completed successfully! Report is ready for viewing.`,
          });
        } catch (error) {
          console.error("Error processing Excel file:", error);
          setTestStatus({
            success: false,
            message: "Error processing the test report. Please try again.",
          });
        }
      };

      fileReader.readAsArrayBuffer(new Blob([response.data]));

      // Create a download URL for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      // Store the URL for download button
      setDownloadUrl(url);
    } catch (err) {
      console.error("Test failed:", err);

      let errorMessage = "An unexpected error occurred";

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.data instanceof Blob) {
          // Try to read the error message from the blob
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.detail || "Test failed with server error";
          } catch (e) {
            errorMessage = `Test failed with status ${err.response.status}`;
          }
        } else {
          errorMessage =
            err.response.data?.detail ||
            `Test failed with status ${err.response.status}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage =
          "No response received from server. Please check your connection.";
      } else {
        // Something happened in setting up the request
        errorMessage = err.message;
      }

      setTestStatus({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="test-manager">
      <div className="test-manager-header">
        <h2>
          <span role="img" aria-label="test">
            🧪
          </span>{" "}
          Test Manager
        </h2>
        <p>Run tests on your Snowflake objects and download test reports</p>
      </div>

      <div className="test-container">
        <div className="test-form">
          <div className="form-group">
            <label htmlFor="test-type">Test Type</label>
            <div className="test-type-selector">
              <button
                className={`test-type-btn ${
                  testType === "usp" ? "active" : ""
                }`}
                onClick={() => setTestType("usp")}
              >
                <span className="test-type-icon">📜</span>
                <span className="test-type-label">Stored Procedure</span>
              </button>
              <button
                className={`test-type-btn ${
                  testType === "pipe" ? "active" : ""
                }`}
                onClick={() => setTestType("pipe")}
              >
                <span className="test-type-icon">🔄</span>
                <span className="test-type-label">Snowpipe</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="schema-name">Schema Name</label>
            <input
              id="schema-name"
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="e.g., PUBLIC"
            />
          </div>

          <div className="form-group">
            <label htmlFor="object-name">
              {testType === "usp" ? "Procedure Name" : "Pipe Name"}
            </label>
            <input
              id="object-name"
              type="text"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              placeholder={
                testType === "usp" ? "e.g., MY_PROCEDURE" : "e.g., MY_PIPE"
              }
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="run-test-btn"
            onClick={handleRunTest}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Running Test...
              </>
            ) : (
              <>
                <span role="img" aria-label="test">
                  🧪
                </span>
                Run Test
              </>
            )}
          </button>

          {downloadUrl && (
            <button
              className="download-report-btn-main"
              onClick={handleDownloadReport}
            >
              <span role="img" aria-label="download">
                ⬇️
              </span>
              Download Report
            </button>
          )}
        </div>

        <div className="test-results">
          {!reportData && !testStatus && (
            <div className="test-info">
              <div className="test-info-content">
                <h3>
                  {testType === "usp"
                    ? "Stored Procedure Testing"
                    : "Snowpipe Testing"}
                </h3>

                <div className="test-description">
                  {testType === "usp" ? (
                    <>
                      <p>
                        <strong>What this test does:</strong>
                      </p>
                      <ul>
                        <li>Analyzes the stored procedure structure</li>
                        <li>
                          Generates test cases with various input parameters
                        </li>
                        <li>Executes the procedure with test data</li>
                        <li>Validates the results against expected outcomes</li>
                        <li>Produces a comprehensive Excel report</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>What this test does:</strong>
                      </p>
                      <ul>
                        <li>Analyzes the Snowpipe configuration</li>
                        <li>
                          Generates sample data based on the target table
                          structure
                        </li>
                        <li>Uploads test files to the configured stage</li>
                        <li>Monitors the pipe for successful data loading</li>
                        <li>Verifies data integrity in the target table</li>
                        <li>Produces a detailed Excel report</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {testStatus && (
            <div
              className={`test-status ${
                testStatus.success ? "success" : "error"
              }`}
            >
              <div className="status-icon">
                {testStatus.success ? "✅" : "❌"}
              </div>
              <div className="status-message">{testStatus.message}</div>
            </div>
          )}

          {reportData && (
            <div className="report-viewer">
              <div className="report-header">
                <div className="report-title-row">
                  <h3>Test Report: {fileName}</h3>
                </div>
                <div className="sheet-tabs">
                  {reportData.map((sheet, index) => (
                    <button
                      key={index}
                      className={`sheet-tab ${
                        activeSheet === index ? "active" : ""
                      }`}
                      onClick={() => setActiveSheet(index)}
                    >
                      {sheet.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="report-content">
                {reportData[activeSheet] && (
                  <DataGrid
                    columns={reportData[activeSheet].headers}
                    rows={reportData[activeSheet].rows}
                    className="report-grid"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
