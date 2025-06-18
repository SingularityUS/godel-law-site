
/**
 * useWorkbenchDragState Hook
 * 
 * Purpose: Manages drag-over visual states for workbench nodes
 * Extracted from useWorkbenchDragDrop for better organization
 */

import { useCallback } from "react";

interface UseWorkbenchDragStateProps {
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useWorkbenchDragState = ({
  setNodes
}: UseWorkbenchDragStateProps) => {
  /**
   * Clear drag-over states on all document input nodes
   */
  const clearDragOverStates = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "document-input") {
          return {
            ...node,
            data: { ...node.data, isDragOver: false }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  /**
   * Update drag-over state for specific node
   */
  const updateDragOverState = useCallback((targetNodeId: string | undefined) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "document-input") {
          const isDragOver = targetNodeId === node.id;
          return {
            ...node,
            data: { ...node.data, isDragOver }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  return {
    clearDragOverStates,
    updateDragOverState
  };
};
