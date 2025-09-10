import React, { createContext, useState, useEffect, useContext } from "react";

export const GeneratedFilesContext = createContext();

export const GeneratedFilesProvider = ({ children }) => {
  const [generatedFilesContext, setGeneratedFilesContext] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("generatedFiles");
    if (stored) {
      setGeneratedFilesContext(JSON.parse(stored));
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      "generatedFiles",
      JSON.stringify(generatedFilesContext)
    );
  }, [generatedFilesContext]);

  return (
    <GeneratedFilesContext.Provider
      value={{ generatedFilesContext, setGeneratedFilesContext }}
    >
      {children}
    </GeneratedFilesContext.Provider>
  );
};
export const useGeneratedFiles = () => useContext(GeneratedFilesContext);
