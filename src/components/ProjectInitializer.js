import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/ProjectInitializer.css";

export default function ProjectInitializer({ onProjectInitialized }) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState("snowflake");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeProjects, setActiveProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch active projects when component mounts
    fetchActiveProjects();
  }, []);

  const fetchActiveProjects = async () => {
    setIsLoading(true);
    setError(null); // Reset error state on new attempt

    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/list-active-projects/",
        {
          timeout: 10000, // Add timeout (10 seconds)
          validateStatus: function (status) {
            return status >= 200 && status < 300; // Only resolve for 2xx statuses
          },
        }
      );

      // Additional validation of response data structure
      if (response.data && Array.isArray(response.data.projects)) {
        setActiveProjects(response.data.projects);
      } else {
        throw new Error("Invalid data structure received from server");
      }
    } catch (err) {
      console.error("Failed to fetch active projects:", err);

      // More specific error messages
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 401) {
          setError("Authentication expired. Please log in again.");
        } else if (err.response.status === 404) {
          setError("Resource not found. Please check the endpoint.");
        } else {
          setError(`Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError("Network error. Please check your connection.");
      } else {
        // Something happened in setting up the request
        setError("Failed to make request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setError("");
    setSuccess("");
    setIsCreating(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/initialize-project/",
        {
          project_name: projectName,
          description: projectDescription,
          project_type: projectType,
        }
      );

      setSuccess(`Project "${projectName}" initialized successfully!`);
      setProjectName("");
      setProjectDescription("");

      // Refresh the list of active projects
      fetchActiveProjects();

      // Notify parent component if callback provided
      if (onProjectInitialized) {
        onProjectInitialized(response.data);
      }
    } catch (err) {
      console.error("Project initialization failed:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to initialize project. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectProject = (project) => {
    if (onProjectInitialized) {
      onProjectInitialized(project);
    }
    setSuccess(`Project "${project.name}" selected!`);
  };

  return (
    <div className="project-initializer">
      <div className="project-initializer-header">
        <h2>
          <span role="img" aria-label="rocket">
            🏗️
          </span>{" "}
          Initialize Project
        </h2>
        <p>
          Create a new project or select an existing one to start generating
          code
        </p>
      </div>

      <div className="project-initializer-layout">
        <div className="active-projects-section">
          <h3 className="section-title">Active Projects</h3>

          {isLoading ? (
            <div className="loading-projects">
              <span className="spinner"></span>
              <p>Loading projects...</p>
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="no-projects-message">
              <div className="emoji">📋</div>
              <p className="title">No active projects</p>
              <p className="description">
                Create a new project to get started with code generation.
              </p>
            </div>
          ) : (
            <div className="projects-list">
              {activeProjects.map((project, index) => (
                <div
                  key={index}
                  className="project-item"
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="project-icon">
                    {project.type === "snowflake"
                      ? "❄️"
                      : project.type === "azure"
                      ? "☁️"
                      : project.type === "aws"
                      ? "☁️"
                      : project.type === "gcp"
                      ? "☁️"
                      : "📁"}
                  </div>
                  <div className="project-details">
                    <h4 className="project-name">{project.name}</h4>
                    <p className="project-description">
                      {project.description || "No description provided"}
                    </p>
                    <div className="project-meta">
                      <span className="project-type">{project.type}</span>
                      <span className="project-date">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="project-select-icon">→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
