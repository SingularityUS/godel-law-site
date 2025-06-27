
/**
 * useWorkbenchPositioning Hook
 * 
 * Purpose: Handles position calculations and coordinate transformations
 * Enhanced with multiple document positioning support
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

  /**
   * Get the next optimal position for a document node to prevent overlap
   */
  const getNextDocumentPosition = useCallback(() => {
    const documentNodes = nodes.filter(node => node.type === "document-input");
    
    // Starting position for first document
    const startX = 80;
    const startY = 100;
    const nodeWidth = 140; // Document node width + margin
    const nodeHeight = 100; // Document node height + margin
    const maxNodesPerRow = 4; // Maximum documents per row
    
    if (documentNodes.length === 0) {
      return { x: startX, y: startY };
    }
    
    // Calculate grid position
    const row = Math.floor(documentNodes.length / maxNodesPerRow);
    const col = documentNodes.length % maxNodesPerRow;
    
    return {
      x: startX + (col * nodeWidth),
      y: startY + (row * nodeHeight)
    };
  }, [nodes]);

  /**
   * Check if a position is clear (no overlapping nodes)
   */
  const isPositionClear = useCallback((x: number, y: number, margin = 50) => {
    return !nodes.some(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      
      return Math.abs(nodeX - x) < margin && Math.abs(nodeY - y) < margin;
    });
  }, [nodes]);

  return {
    getNodeAtPosition,
    calculateFlowPosition,
    getNextDocumentPosition,
    isPositionClear
  };
};
