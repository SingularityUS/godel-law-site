
/**
 * useWorkbenchDragDrop Hook
 * 
 * Purpose: Centralized drag-and-drop orchestration for the AI Workbench
 * Refactored to use specialized hooks for better maintainability
 * 
 * Key Responsibilities:
 * - Orchestrates drop handling and visual feedback systems
 * - Coordinates between specialized drag-drop hooks
 * - Maintains clean separation of drag-drop concerns
 * 
 * Integration Points:
 * - Uses drop handling hook for actual drop operations
 * - Uses drag visuals hook for visual feedback
 * - Uses drag state hook for state management
 * - Handles React Flow container coordinate transformations
 */

import { Node } from "@xyflow/react";
import { useWorkbenchDragState } from "./useWorkbenchDragState";
import { useWorkbenchDropHandling } from "./useWorkbenchDropHandling";
import { useWorkbenchDragVisuals } from "./useWorkbenchDragVisuals";

type AllNodes = Node<any>;

interface UseWorkbenchDragDropProps {
  nodes: AllNodes[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

export const useWorkbenchDragDrop = ({
  nodes,
  setNodes,
  reactFlowWrapper
}: UseWorkbenchDragDropProps) => {
  // Initialize drag state management
  const { clearDragOverStates, updateDragOverState } = useWorkbenchDragState({
    setNodes
  });

  // Initialize drop handling
  const { onDrop } = useWorkbenchDropHandling({
    nodes,
    setNodes,
    reactFlowWrapper,
    clearDragOverStates
  });

  // Initialize drag visual feedback
  const { onDragOver, onDragLeave } = useWorkbenchDragVisuals({
    nodes,
    reactFlowWrapper,
    updateDragOverState,
    clearDragOverStates
  });

  return {
    onDrop,
    onDragOver,
    onDragLeave
  };
};
