
/**
 * useDragOptimization Hook
 * 
 * Purpose: Optimizes drag performance by detecting drag states and batching updates
 */

import { useCallback, useRef } from "react";
import { Node } from "@xyflow/react";

interface UseDragOptimizationProps {
  updateNodes: (nodes: Node[]) => void;
}

export const useDragOptimization = ({ updateNodes }: UseDragOptimizationProps) => {
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Optimized nodes change handler that batches drag updates
   */
  const handleOptimizedNodesChange = useCallback((changes: any[], currentNodes: Node[]) => {
    // Check if any change is a drag operation
    const hasDragChange = changes.some(change => 
      change.type === 'position' && change.dragging
    );
    
    const hasNonDragChange = changes.some(change => 
      change.type !== 'position' || !change.dragging
    );

    // Apply changes to get updated nodes
    const updatedNodes = currentNodes.map(node => {
      const change = changes.find(c => c.id === node.id);
      if (!change) return node;
      
      switch (change.type) {
        case 'position':
          return { 
            ...node, 
            position: change.position || node.position
          };
        case 'dimensions':
          return { 
            ...node, 
            width: change.dimensions?.width || node.width, 
            height: change.dimensions?.height || node.height 
          };
        case 'remove':
          return null;
        case 'select':
          return { ...node, selected: change.selected };
        default:
          return node;
      }
    }).filter(Boolean) as Node[];

    if (hasDragChange) {
      // Set dragging state
      isDraggingRef.current = true;
      
      // Clear existing timeout
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      
      // Only update workspace state after drag ends (with debounce)
      dragTimeoutRef.current = setTimeout(() => {
        isDraggingRef.current = false;
        updateNodes(updatedNodes);
      }, 100);
    }
    
    // Immediately update for non-drag changes (select, remove, etc.)
    if (hasNonDragChange || !hasDragChange) {
      updateNodes(updatedNodes);
    }

    return updatedNodes;
  }, [updateNodes]);

  return {
    handleOptimizedNodesChange,
    isDragging: isDraggingRef.current
  };
};
