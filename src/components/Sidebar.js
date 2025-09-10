import React, { useState } from "react";
import "../css/Sidebar.css";

export default function Sidebar() {
  const [activeIcon, setActiveIcon] = useState(0);

  const icons = [
    { name: "Design", icon: "✏️" },
    { name: "Database", icon: "🗄️" },
    { name: "Deploy", icon: "🚀" },
    { name: "Monitor", icon: "📊" },
    { name: "Settings", icon: "⚙️" },
  ];

  return (
    <div
      className="sidebar"
      style={{
        width: "70px",
        height: "100vh",
        backgroundColor: "#1e293b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 200,
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: "#3b82f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "30px",
          fontSize: "20px",
        }}
      >
        ❄️
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          alignItems: "center",
          flexGrow: 1,
        }}
      >
        {icons.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveIcon(index)}
            style={{
              width: "50px",
              height: "50px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: activeIcon === index ? "#2d3748" : "transparent",
              border: "none",
              borderRadius: "10px",
              color: activeIcon === index ? "#fff" : "#94a3b8",
              fontSize: "11px",
              cursor: "pointer",
              transition: "all 0.2s",
              gap: "5px",
              padding: "8px 0",
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      <button
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: "transparent",
          border: "1px solid #334155",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "auto",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        👤
      </button>
    </div>
  );
}
