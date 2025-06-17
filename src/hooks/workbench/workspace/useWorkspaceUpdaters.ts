
/**
 * useWorkspaceUpdaters Hook
 * 
 * Purpose: Provides optimized update functions for nodes and edges
 * Handles workspace state updates efficiently to prevent performance issues
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";

interface WorkspaceData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  isDefault: boolean;
}

interface UseWorkspaceUpdatersProps {
  workspace: WorkspaceData;
  setWorkspace: (workspace: WorkspaceData) => void;
}

export const useWorkspaceUpdaters = ({
  workspace,
  setWorkspace
}: UseWorkspaceUpdatersProps) => {

  /**
   * Update nodes in the workspace
   * Optimized to avoid excessive re-renders during drag operations
   */
  const updateNodes = useCallback((nodes: Node[]) => {
    setWorkspace({
      ...workspace,
      nodes
    });
  }, [workspace.id, workspace.name, workspace.edges, workspace.isDefault, setWorkspace]);

  /**
   * Update edges in the workspace
   * Optimized to avoid excessive re-renders
   */
  const updateEdges = useCallback((edges: Edge[]) => {
    setWorkspace({
      ...workspace,
      edges
    });
  }, [workspace.id, workspace.name, workspace.nodes, workspace.isDefault, setWorkspace]);

  return {
    updateNodes,
    updateEdges
  };
};
