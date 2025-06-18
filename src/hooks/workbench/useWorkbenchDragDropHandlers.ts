
/**
 * useWorkbenchDragDropHandlers Hook
 * 
 * Purpose: Centralized drag-drop event handlers for the workbench
 * Extracted from WorkbenchDragDrop for better organization and reusability
 */

import { useCallback } from "react";

export const useWorkbenchDragDropHandlers = () => {
  /**
   * Handle module palette drag start
   * Sets up drag data for module drops from the palette
   */
  const handlePaletteDragStart = useCallback((mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  }, []);

  return {
    handlePaletteDragStart
  };
};
