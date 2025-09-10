import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, graphConfig } from "../authConfig";

/**
 * Custom hook to call the Microsoft Graph API using the access token obtained from MSAL
 */
export const useGraphData = () => {
  const { instance, accounts } = useMsal();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchGraphData();
    }
  }, [accounts]);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      if (!graphResponse.ok) {
        throw new Error(`HTTP error! status: ${graphResponse.status}`);
      }

      const userData = await graphResponse.json();
      setGraphData(userData);
    } catch (error) {
      console.error("Error fetching Graph data:", error);
      setError(error.message);

      // If silent token acquisition fails, try interactive
      try {
        const response = await instance.acquireTokenPopup(loginRequest);
        const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
          headers: {
            Authorization: `Bearer ${response.accessToken}`,
          },
        });

        if (graphResponse.ok) {
          const userData = await graphResponse.json();
          setGraphData(userData);
          setError(null);
        }
      } catch (interactiveError) {
        console.error(
          "Interactive token acquisition failed:",
          interactiveError
        );
        setError(interactiveError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { graphData, loading, error, refetch: fetchGraphData };
};
