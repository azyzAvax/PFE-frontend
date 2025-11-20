// src/components/DashboardPipelineGenerator.tsx
import React, { useState } from "react";
import axios from "axios";
import MermaidRenderer from "./MermaidRenderer.tsx";

interface FlowStep {
  step_name: string;
  logic: string;
}

interface Explanation {
  step: string;
  description: string;
}

interface PipelineResponse {
  flow?: { steps: FlowStep[] };
  diagram?: string;
  explanations?: Explanation[];
}

export default function DashboardPipelineGenerator() {
  const [prompt, setPrompt] = useState<string>("");
  const [flow, setFlow] = useState<PipelineResponse["flow"] | null>(null);
  const [diagram, setDiagram] = useState<string>("");
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setFlow(null);
    setDiagram("");
    setExplanations([]);

    try {
      const response = await axios.post<PipelineResponse>(
        "http://127.0.0.1:8000/api/pipeline/dashboard",
        { dashboard_prompt: prompt }
      );

      setFlow(response.data.flow ?? null);
      setDiagram(response.data.diagram ?? "");
      setExplanations(response.data.explanations ?? []);
    } catch (err) {
      console.error("Pipeline generation failed:", err);
      setError("Something went wrong while generating the pipeline.");
    } finally {
      setLoading(false);
    }
  };
console.log(prompt)
  return (
    <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px" }}>
      <h2>🧠 Generate Data Pipeline for Dashboard</h2>

      <textarea
        placeholder="Describe your dashboard (KPIs, dimensions, business goal)..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{
          width: "100%",
          height: "120px",
          marginBottom: "15px",
          padding: "10px",
          fontSize: "14px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontFamily: "monospace",
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !prompt}
        style={{
          padding: "10px 20px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Pipeline"}
      </button>

      {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}

      {diagram && (
        <div style={{ marginTop: "30px" }}>
          <h3>📈 Pipeline Diagram</h3>
          <MermaidRenderer chart={diagram.replace(/```mermaid\n?|\n?```/g, "").trim()} />
        </div>
      )}

      {flow && (
        <div style={{ marginTop: "30px" }}>
          <h3>🧩 Pipeline Steps</h3>
          <ul>
            {flow.steps.map((step, i) => (
              <li key={i}>
                <strong>{step.step_name}</strong> — {step.logic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanations.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>📝 Explanations</h3>
          <ul>
            {explanations.map((ex, i) => (
              <li key={i}>
                <strong>{ex.step}</strong>: {ex.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
