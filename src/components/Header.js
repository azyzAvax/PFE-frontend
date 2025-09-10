import React from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { ProfileData } from "./ProfileData";
import { SignOutButton } from "./SignOutButton";
import { useGraphData } from "../hooks/useGraphData";
import "../css/Header.css";
import "../css/Auth.css";

export default function Header() {
  const isAuthenticated = useIsAuthenticated();
  const { graphData, loading, error } = useGraphData();

  return (
    <header
      style={{
        padding: "1rem 2rem",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: isAuthenticated
          ? "linear-gradient(90deg, #1a365d 0%, #3182ce 100%)"
          : "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: isAuthenticated ? "white" : "#1e293b",
            marginRight: "8px",
          }}
        >
          ❄️
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 600,
            color: isAuthenticated ? "white" : "#1e293b",
            letterSpacing: "-0.025em",
          }}
        >
          Snowflake Data Integration Builder
        </h1>
      </div>

      <div className="header-auth">
        {isAuthenticated ? (
          <>
            {error && (
              <div className="auth-error">Error loading profile: {error}</div>
            )}
            {loading ? (
              <div
                style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}
              >
                Loading profile...
              </div>
            ) : graphData ? (
              <ProfileData graphData={graphData} />
            ) : null}
            <SignOutButton />
          </>
        ) : (
          <button
            style={{
              padding: "8px 12px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              borderRadius: "6px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <span>?</span> Help
          </button>
        )}
      </div>
    </header>
  );
}
