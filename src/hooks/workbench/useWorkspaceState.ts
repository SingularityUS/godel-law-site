
/**
 * useWorkspaceState Hook
 * 
 * Purpose: Main orchestrator for workspace state management
 * Combines storage, drag-optimized auto-save, and update functionality
 */

import { useEffect } from "react";
import { useWorkspaceStorage } from "./workspace/useWorkspaceStorage";
import { useDragOptimizedAutoSave } from "./workspace/useDragOptimizedAutoSave";
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

  // Initialize drag-optimized auto-save functionality
  const { startDragging, isDragging } = useDragOptimizedAutoSave({
    workspace,
    saveWorkspace,
    normalSaveDelay: 3000, // 3 seconds for normal changes
    dragSaveDelay: 1000    // 1 second after drag stops
  });

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
    startDragging,
    isDragging
  };
};
