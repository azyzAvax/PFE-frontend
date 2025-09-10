import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { SignInButton } from "./components/SignInButton";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import "./css/App.css";
import "./css/Auth.css";
import { GeneratedFilesProvider } from "../src//hooks/GeneratedFilesContext";
function App() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Map MSAL progress state to your preferred loader message
  let loaderMessage = "Authenticating...";
  if (inProgress === "login" || inProgress === "ssoSilent") {
    loaderMessage = "Authenticating...";
  } else if (inProgress === "logout") {
    loaderMessage = "Logging out...";
  } else if (inProgress === "acquireToken") {
    loaderMessage = "Refreshing session...";
  }

  if (inProgress !== "none") {
    return (
      <div className="auth-loading">
        <span className="spinner" />
        <p>{loaderMessage}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInButton />;
  }

  return (
    <div className="App">
      <GeneratedFilesProvider>
        <Dashboard />
      </GeneratedFilesProvider>
    </div>
  );
}

export default App;
