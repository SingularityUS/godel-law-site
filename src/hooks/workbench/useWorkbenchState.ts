
/**
 * useWorkbenchState Hook
 * 
 * Purpose: Core React Flow state management for the AI Workbench
 * This hook encapsulates the fundamental state management operations
 * for nodes and edges in the React Flow workspace.
 * 
 * Key Responsibilities:
 * - Manages nodes and edges state using React Flow hooks
 * - Provides state setters for external manipulation
 * - Handles edge creation between nodes
 * - Maintains React Flow's internal state consistency
 * 
 * Integration Points:
 * - Used by useWorkbenchEvents as the core state foundation
 * - Provides state to other workbench hooks
 * - Coordinates with React Flow's built-in state management
 * - Exposes state and handlers for UI components
 * 
 * Architecture Benefits:
 * - Separates state concerns from event handling
 * - Provides clean interface for state operations
 * - Enables independent testing of state logic
 * - Simplifies state-related debugging
 */

import { useCallback } from "react";
import { useNodesState, useEdgesState, addEdge, Connection, Node, Edge } from "@xyflow/react";

// Type definition for all supported node types in the workbench
type AllNodes = Node<any>;

interface UseWorkbenchStateProps {
  initialNodes: AllNodes[];
  initialEdges: Edge[];
}

export const useWorkbenchState = ({
  initialNodes,
  initialEdges
}: UseWorkbenchStateProps) => {
  // React Flow state management hooks
  // These provide the core state and change handlers for the flow diagram
  const [nodes, setNodes, onNodesChange] = useNodesState<AllNodes>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /**
   * Connection Handler: Creates Edges Between Nodes
   * 
   * Called when users connect two nodes by dragging from one handle to another
   * Creates animated edges with metadata for visual appeal and data flow indication
   * 
   * @param connection - Connection object with source and target node IDs
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { 
            ...connection, 
            animated: true, 
            type: "smoothstep", 
            data: { label: "JSON" } // Indicates data format being passed
          },
          eds
        )
      );
    },
    [setEdges]
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect
  };
};
