import React from "react";

/**
 * Renders information about the signed-in user
 */
export const ProfileData = (props) => {
  const { graphData } = props;

  return (
    <div className="profile-data">
      <div className="profile-avatar">
        {graphData.displayName
          ? graphData.displayName.charAt(0).toUpperCase()
          : "U"}
      </div>
      <div className="profile-info">
        <p className="profile-name">
          <strong>Welcome, {graphData.displayName || "User"}</strong>
        </p>
        <p className="profile-email">
          {graphData.mail || graphData.userPrincipalName}
        </p>
        {graphData.jobTitle && (
          <p className="profile-title">{graphData.jobTitle}</p>
        )}
      </div>
    </div>
  );
};
