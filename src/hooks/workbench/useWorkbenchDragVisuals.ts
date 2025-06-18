
/**
 * useWorkbenchDragVisuals Hook
 * 
 * Purpose: Manages visual feedback during drag operations
 * Extracted from useWorkbenchDragDrop for better separation of concerns
 * 
 * Key Responsibilities:
 * - Provides visual feedback during drag-over operations
 * - Manages drag-leave cleanup
 * - Coordinates with positioning for target detection
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useWorkbenchPositioning } from "./useWorkbenchPositioning";

type AllNodes = Node<any>;

interface UseWorkbenchDragVisualsProps {
  nodes: AllNodes[];
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  updateDragOverState: (targetNodeId: string | undefined) => void;
  clearDragOverStates: () => void;
}

export const useWorkbenchDragVisuals = ({
  nodes,
  reactFlowWrapper,
  updateDragOverState,
  clearDragOverStates
}: UseWorkbenchDragVisualsProps) => {
  const { getNodeAtPosition } = useWorkbenchPositioning({
    nodes,
    reactFlowWrapper
  });

  /**
   * Provide visual feedback during drag operations
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    
    // Only handle visual feedback for document drags
    const docData = event.dataTransfer.types.includes("application/lovable-document");
    if (docData) {
      const targetNode = getNodeAtPosition(event.clientX, event.clientY);
      updateDragOverState(targetNode?.id);
    }
  }, [getNodeAtPosition, updateDragOverState]);

  /**
   * Clean up visual states when drag leaves workspace
   */
  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear states if actually leaving the container
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as HTMLElement)) {
      clearDragOverStates();
    }
  }, [clearDragOverStates, reactFlowWrapper]);

  return {
    onDragOver,
    onDragLeave
  };
};
