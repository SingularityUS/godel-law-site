
/**
 * useWorkspaceState Hook
 * 
 * Purpose: Main orchestrator for workspace state management
 * Combines storage, auto-save, and update functionality
 */

import { useEffect } from "react";
import { useWorkspaceStorage } from "./workspace/useWorkspaceStorage";
import { useWorkspaceAutoSave } from "./workspace/useWorkspaceAutoSave";
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

  // Initialize auto-save functionality
  useWorkspaceAutoSave({
    workspace,
    saveWorkspace
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
    updateEdges
  };
};
