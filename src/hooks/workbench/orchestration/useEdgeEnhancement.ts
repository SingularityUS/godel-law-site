
/**
 * useEdgeEnhancement Hook
 * 
 * Purpose: Enhances edges with data preview functionality
 */

import { useMemo } from "react";

interface UseEdgeEnhancementProps {
  edges: any[];
  getEdgeData: (edgeId: string) => any;
  simulateProcessing: (edgeId: string) => void;
  isEdgeSelected: (edgeId: string) => boolean;
  toggleEdgePreview: (edgeId: string) => void;
  handleClosePreview: (edgeId: string) => void;
}

export const useEdgeEnhancement = ({
  edges,
  getEdgeData,
  simulateProcessing,
  isEdgeSelected,
  toggleEdgePreview,
  handleClosePreview
}: UseEdgeEnhancementProps) => {
  
  /**
   * Enhance edges with data preview functionality and selection state
   */
  const enhancedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        edgeData: getEdgeData(edge.id),
        onSimulateProcessing: () => simulateProcessing(edge.id),
        isSelected: isEdgeSelected(edge.id),
        onEdgeClick: toggleEdgePreview,
        onClosePreview: handleClosePreview
      }
    }));
  }, [edges, getEdgeData, simulateProcessing, isEdgeSelected, toggleEdgePreview, handleClosePreview]);

  return { enhancedEdges };
};
