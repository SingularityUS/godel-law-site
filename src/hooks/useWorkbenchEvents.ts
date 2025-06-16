
/**
 * useWorkbenchEvents Hook
 * 
 * Purpose: Orchestrates all workbench event handling systems
 * This hook coordinates multiple specialized hooks to provide a unified
 * interface for workbench event management and state operations.
 * 
 * Key Responsibilities:
 * - Coordinates state management through useWorkbenchState
 * - Manages drag-drop operations via useWorkbenchDragDrop
 * - Handles node events through useWorkbenchNodeEvents
 * - Processes keyboard interactions with useWorkbenchKeyboard
 * - Provides unified API for workbench components
 * 
 * Integration Points:
 * - Used by WorkbenchFlow for complete event management
 * - Coordinates between specialized event handling hooks
 * - Maintains separation of concerns while providing unified interface
 * - Enables independent testing of event handling systems
 * 
 * Architecture Benefits:
 * - Improved maintainability through separation of concerns
 * - Better testability of individual event handling systems
 * - Cleaner interfaces for specific event types
 * - Easier debugging and development workflow
 */

import { Node, Edge } from "@xyflow/react";
import { useWorkbenchState } from "./workbench/useWorkbenchState";
import { useWorkbenchDragDrop } from "./workbench/useWorkbenchDragDrop";
import { useWorkbenchNodeEvents } from "./workbench/useWorkbenchNodeEvents";
import { useWorkbenchKeyboard } from "./workbench/useWorkbenchKeyboard";

// Type definition for all supported node types in the workbench
type AllNodes = Node<any>;

interface UseWorkbenchEventsProps {
  initialNodes: AllNodes[];
  initialEdges: Edge[];
  getNodeAtPosition: (x: number, y: number) => Node | null;
}

export const useWorkbenchEvents = ({
  initialNodes,
  initialEdges,
  getNodeAtPosition
}: UseWorkbenchEventsProps) => {

  // Initialize core state management
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect
  } = useWorkbenchState({
    initialNodes,
    initialEdges
  });

  // Initialize drag-drop handling
  const {
    onDrop,
    onDragOver,
    onDragLeave
  } = useWorkbenchDragDrop({
    setNodes,
    getNodeAtPosition
  });

  // Initialize node event handling
  useWorkbenchNodeEvents({
    setNodes,
    setEdges
  });

  // Initialize keyboard event handling
  useWorkbenchKeyboard({
    nodes,
    setNodes,
    setEdges
  });

  // Return unified interface for workbench components
  return {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onDrop,
    onDragOver,
    onDragLeave,
    onConnect
  };
};
