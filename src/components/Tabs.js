import React from "react";
import "../css/Tabs.css";

export default function Tabs({ activeTab, setActiveTab, tabs }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        gap: "4px",
        height: "50px",
        overflow: "auto",
        position: "sticky",
        top: "60px",
        zIndex: 90,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(index)}
          style={{
            padding: "0 16px",
            height: "100%",
            border: "none",
            backgroundColor: "transparent",
            color: activeTab === index ? "#3b82f6" : "#64748b",
            fontWeight: activeTab === index ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            position: "relative",
            borderBottom: activeTab === index ? "2px solid #3b82f6" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
        >
          {typeof tab === "string" ? (
            tab
          ) : (
            <>
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label || tab}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
