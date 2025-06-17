
/**
 * useWorkbenchEvents Hook
 * 
 * Purpose: Orchestrates all workbench event handling systems
 * Now works with external state management for workspace persistence
 */

import { Node, Edge } from "@xyflow/react";
import { useWorkbenchState } from "./workbench/useWorkbenchState";
import { useWorkbenchDragDrop } from "./workbench/useWorkbenchDragDrop";
import { useWorkbenchNodeEvents } from "./workbench/useWorkbenchNodeEvents";
import { useWorkbenchKeyboard } from "./workbench/useWorkbenchKeyboard";
import { useEffect } from "react";

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

  // Initialize core state management with external initial state
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

  // Sync with external state changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
