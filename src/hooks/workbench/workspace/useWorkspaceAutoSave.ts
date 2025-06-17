
/**
 * useWorkspaceAutoSave Hook
 * 
 * Purpose: Handles automatic saving of workspace changes
 * Implements debounced saving to prevent excessive database calls
 */

import { useEffect, useRef, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";

interface WorkspaceData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  isDefault: boolean;
}

interface UseWorkspaceAutoSaveProps {
  workspace: WorkspaceData;
  saveWorkspace: (workspaceData: WorkspaceData) => Promise<void>;
  saveDelay?: number;
}

export const useWorkspaceAutoSave = ({
  workspace,
  saveWorkspace,
  saveDelay = 1000
}: UseWorkspaceAutoSaveProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  /**
   * Debounced save function that delays saving until user stops making changes
   */
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentWorkspaceString = JSON.stringify({
        nodes: workspace.nodes,
        edges: workspace.edges
      });

      // Only save if the workspace has actually changed
      if (currentWorkspaceString !== lastSavedRef.current && workspace.id) {
        console.log('Auto-saving workspace changes...');
        saveWorkspace(workspace);
        lastSavedRef.current = currentWorkspaceString;
      }
    }, saveDelay);
  }, [workspace, saveWorkspace, saveDelay]);

  /**
   * Trigger auto-save when workspace changes
   */
  useEffect(() => {
    if (workspace.id) {
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workspace.nodes, workspace.edges, debouncedSave]);

  /**
   * Initialize the last saved reference when workspace loads
   */
  useEffect(() => {
    if (workspace.id) {
      lastSavedRef.current = JSON.stringify({
        nodes: workspace.nodes,
        edges: workspace.edges
      });
    }
  }, [workspace.id]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
};
