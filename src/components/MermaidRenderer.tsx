import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chart || !container.current) return;

    const renderMermaid = async () => {
      try {
        // Clean chart input (remove whitespace and backticks if needed)
        const cleanedChart = chart
          .replace(/```mermaid\n?/g, "")
          .replace(/```/g, "")
          .trim();

        // Prevent double rendering
        container.current!.innerHTML = "";

        // (Re-)Initialize Mermaid
        mermaid.initialize({ startOnLoad: false });

        // Render Mermaid after slight delay to allow DOM to stabilize
        const { svg } = await mermaid.render("mermaid-diagram", cleanedChart);
        container.current!.innerHTML = svg;
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        container.current!.innerHTML =
          "<p style='color:red'>Failed to render diagram.</p>";
      }
    };

    const timeout = setTimeout(renderMermaid, 100); // Delay helps React mount first
    return () => clearTimeout(timeout);
  }, [chart]);

  return <div ref={container} />;
};

export default MermaidRenderer;
