
/**
 * useDataPreviewSelection Hook
 * 
 * Purpose: Manages which edge is currently selected for data preview
 * This hook provides state management for showing/hiding data preview boxes
 * to prevent workspace clutter while maintaining inspection capabilities.
 */

import { useState, useCallback } from "react";

export const useDataPreviewSelection = () => {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  /**
   * Toggle data preview for an edge
   * If the edge is already selected, hide the preview
   * If a different edge is selected, switch to the new edge
   */
  const toggleEdgePreview = useCallback((edgeId: string) => {
    setSelectedEdgeId(current => current === edgeId ? null : edgeId);
  }, []);

  /**
   * Hide all data previews
   * Used when clicking on empty workspace or performing other operations
   */
  const hideAllPreviews = useCallback(() => {
    setSelectedEdgeId(null);
  }, []);

  /**
   * Check if a specific edge is selected for preview
   */
  const isEdgeSelected = useCallback((edgeId: string) => {
    return selectedEdgeId === edgeId;
  }, [selectedEdgeId]);

  return {
    selectedEdgeId,
    toggleEdgePreview,
    hideAllPreviews,
    isEdgeSelected
  };
};
