
/**
 * useWorkspaceUpdaters Hook
 * 
 * Purpose: Provides update functions for nodes and edges
 * Handles workspace state updates in a controlled manner
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
   */
  const updateNodes = useCallback((nodes: Node[]) => {
    console.log('Updating workspace nodes:', nodes.length);
    setWorkspace({
      ...workspace,
      nodes
    });
  }, [workspace, setWorkspace]);

  /**
   * Update edges in the workspace
   */
  const updateEdges = useCallback((edges: Edge[]) => {
    console.log('Updating workspace edges:', edges.length);
    setWorkspace({
      ...workspace,
      edges
    });
  }, [workspace, setWorkspace]);

  return {
    updateNodes,
    updateEdges
  };
};
