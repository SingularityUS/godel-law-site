
/**
 * useDragStateDetection Hook
 * 
 * Purpose: Detects when users are actively dragging nodes in React Flow
 * Provides drag state information to optimize performance during drag operations
 */

import { useCallback, useRef } from "react";
import { Node } from "@xyflow/react";

interface UseDragStateDetectionProps {
  onDragStart: () => void;
}

export const useDragStateDetection = ({ onDragStart }: UseDragStateDetectionProps) => {
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isDraggingRef = useRef(false);

  /**
   * Enhanced nodes change handler that detects drag operations
   */
  const handleNodesChangeWithDragDetection = useCallback((changes: any[], originalHandler: (changes: any[]) => void) => {
    let hasPositionChanges = false;
    let hasDragStart = false;

    // Analyze changes to detect drag operations
    changes.forEach(change => {
      if (change.type === 'position') {
        hasPositionChanges = true;
        
        // Check if this is the start of a drag operation
        const lastPos = dragStartPositions.current.get(change.id);
        if (!lastPos) {
          // First position change - likely drag start
          dragStartPositions.current.set(change.id, change.position);
          hasDragStart = true;
        } else {
          // Check if position has changed significantly
          const deltaX = Math.abs(change.position.x - lastPos.x);
          const deltaY = Math.abs(change.position.y - lastPos.y);
          
          if (deltaX > 5 || deltaY > 5) {
            // Significant movement - definitely dragging
            if (!isDraggingRef.current) {
              hasDragStart = true;
            }
          }
        }
      } else if (change.type === 'select' && !change.selected) {
        // Node deselected - might be end of drag
        dragStartPositions.current.delete(change.id);
      }
    });

    // Notify about drag start
    if (hasDragStart && !isDraggingRef.current) {
      isDraggingRef.current = true;
      onDragStart();
    }

    // Reset drag state if no position changes for a while
    if (!hasPositionChanges && isDraggingRef.current) {
      setTimeout(() => {
        if (dragStartPositions.current.size === 0) {
          isDraggingRef.current = false;
        }
      }, 300);
    }

    // Call the original handler
    originalHandler(changes);
  }, [onDragStart]);

  return {
    handleNodesChangeWithDragDetection
  };
};
