
/**
 * useWorkbenchPositioning Hook
 * 
 * Purpose: Handles position calculations and coordinate transformations
 * Extracted from useWorkbenchDragDrop for better separation of concerns
 */

import { useCallback } from "react";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";

interface UseWorkbenchPositioningProps {
  nodes: any[];
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

export const useWorkbenchPositioning = ({
  nodes,
  reactFlowWrapper
}: UseWorkbenchPositioningProps) => {
  /**
   * Get node at specific screen coordinates
   */
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
  }, [nodes, reactFlowWrapper]);

  /**
   * Calculate position within React Flow coordinate system
   */
  const calculateFlowPosition = useCallback((clientX: number, clientY: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    
    if (!reactFlowBounds) {
      // Fallback position if bounds are not available
      return { x: 80, y: 420 + Math.random() * 100 };
    }

    return {
      x: clientX - reactFlowBounds.left - 65,
      y: clientY - reactFlowBounds.top - 30,
    };
  }, [reactFlowWrapper]);

  return {
    getNodeAtPosition,
    calculateFlowPosition
  };
};
