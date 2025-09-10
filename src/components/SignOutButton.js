import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";

export const SignOutButton = () => {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    setIsLoading(true);
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  };

  return (
    <button
      className="sign-out-btn"
      onClick={handleLogout}
      title="Sign out"
      disabled={isLoading}
      style={{ opacity: isLoading ? 0.7 : 1 }}
    >
      <span className="sign-out-icon">↗️</span>
      {isLoading && (
        <span
          className="button-spinner"
          style={{
            width: 16,
            height: 16,
            borderWidth: 2,
            marginRight: 6,
          }}
        />
      )}
      {isLoading ? "Signing Out..." : "Sign Out"}
    </button>
  );
};
