
/**
 * useWorkspaceState Hook
 * 
 * Purpose: Main orchestrator for workspace state management
 * Simplified to remove auto-save and only save on explicit actions
 */

import { useEffect } from "react";
import { useWorkspaceStorage } from "./workspace/useWorkspaceStorage";
import { useWorkspaceUpdaters } from "./workspace/useWorkspaceUpdaters";

export const useWorkspaceState = () => {
  // Initialize storage operations
  const {
    workspace,
    setWorkspace,
    saveStatus,
    isLoading,
    loadWorkspace,
    saveWorkspace
  } = useWorkspaceStorage();

  // Initialize update functions
  const { updateNodes, updateEdges } = useWorkspaceUpdaters({
    workspace,
    setWorkspace
  });

  // Load workspace on mount
  useEffect(() => {
    loadWorkspace();
  }, []);

  return {
    workspace,
    saveStatus,
    isLoading,
    updateNodes,
    updateEdges,
    saveWorkspace
  };
};
