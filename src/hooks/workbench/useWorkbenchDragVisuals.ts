
/**
 * useWorkbenchDragVisuals Hook
 * 
 * Purpose: Manages visual feedback during drag operations
 * Enhanced to support multiple document queue building
 */

import { useCallback } from "react";

interface UseWorkbenchDragVisualsProps {
  nodes: any[];
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
  /**
   * Enhanced drag over handler with visual feedback for document queue building
   */
  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

      // Check if we're dragging a document
      const hasDocumentData = event.dataTransfer.types.includes("application/lovable-document");
      
      if (hasDocumentData) {
        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        // Calculate relative position within React Flow
        const relativeX = event.clientX - reactFlowBounds.left;
        const relativeY = event.clientY - reactFlowBounds.top;

        // Find if we're hovering over an existing document node
        const targetNode = nodes.find(node => {
          if (node.type !== "document-input") return false;
          
          const nodeX = node.position.x;
          const nodeY = node.position.y;
          const nodeWidth = 128; // Document node width
          const nodeHeight = 96; // Document node height
          
          return relativeX >= nodeX && relativeX <= nodeX + nodeWidth &&
                 relativeY >= nodeY && relativeY <= nodeY + nodeHeight;
        });

        if (targetNode) {
          // Hovering over existing document - show replacement feedback
          updateDragOverState(targetNode.id);
          event.dataTransfer.dropEffect = "move";
        } else {
          // Hovering over empty space - show addition feedback
          clearDragOverStates();
          event.dataTransfer.dropEffect = "copy";
        }
      }
    },
    [nodes, reactFlowWrapper, updateDragOverState, clearDragOverStates]
  );

  /**
   * Handle drag leave events
   */
  const onDragLeave = useCallback(
    (event: React.DragEvent) => {
      // Only clear if we're actually leaving the React Flow area
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const isLeavingReactFlow = 
        event.clientX < reactFlowBounds.left ||
        event.clientX > reactFlowBounds.right ||
        event.clientY < reactFlowBounds.top ||
        event.clientY > reactFlowBounds.bottom;

      if (isLeavingReactFlow) {
        clearDragOverStates();
      }
    },
    [reactFlowWrapper, clearDragOverStates]
  );

  return {
    onDragOver,
    onDragLeave
  };
};
