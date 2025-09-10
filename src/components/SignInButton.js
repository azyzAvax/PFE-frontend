import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

export const SignInButton = () => {
  const { instance, inProgress } = useMsal();
  const isLoading = inProgress !== "none";

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-card">
        <div className="sign-in-header">
          <h2>Welcome to SnowAI Platform</h2>
          <h1>❄️</h1>
          <p>Please sign in to access your workspace</p>
        </div>
        <div className="sign-in-buttons">
          <button
            className="sign-in-btn primary"
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              opacity: isLoading ? 0.7 : 1,
              pointerEvents: isLoading ? "none" : "auto",
            }}
          >
            <span className="sign-in-icon">🔐</span>
            {isLoading && <span className="button-spinner" />}
            {isLoading ? "Signing in..." : "Sign in using Azure AD"}
          </button>
        </div>
        <div className="sign-in-info">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};
