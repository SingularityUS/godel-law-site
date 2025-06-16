
/**
 * useWorkbenchNodeEvents Hook
 * 
 * Purpose: Manages node-specific event handling for the AI Workbench
 * This hook handles custom events dispatched by individual nodes
 * for operations like deletion and settings access.
 * 
 * Key Responsibilities:
 * - Listens for deleteNode events from child components
 * - Manages node deletion and related edge cleanup
 * - Provides clean separation of node event concerns
 * - Maintains loose coupling between parent and child components
 * 
 * Integration Points:
 * - Uses workbench state setters for node manipulation
 * - Coordinates with HelperNode and DocumentInputNode components
 * - Handles custom event system for component communication
 * - Manages React Flow state consistency during operations
 * 
 * Event Flow:
 * 1. Child components dispatch custom events (deleteNode)
 * 2. This hook receives events and extracts relevant data
 * 3. State updates are applied to nodes and edges
 * 4. React Flow re-renders with updated state
 */

import { useEffect } from "react";
import { Node, Edge } from "@xyflow/react";

// Type definition for all supported node types in the workbench
type AllNodes = Node<any>;

interface UseWorkbenchNodeEventsProps {
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useWorkbenchNodeEvents = ({
  setNodes,
  setEdges
}: UseWorkbenchNodeEventsProps) => {

  /**
   * Custom Event Handler: Node Deletion
   * 
   * Listens for deleteNode events dispatched by child components
   * This pattern allows child components to trigger parent state changes
   * without direct prop passing, maintaining loose coupling
   * 
   * Event Flow:
   * 1. Child component (HelperNode/DocumentInputNode) dispatches deleteNode event
   * 2. This handler receives the event and extracts nodeId
   * 3. Node and related edges are removed from state
   * 4. React Flow re-renders with updated state
   */
  useEffect(() => {
    const handleDeleteNode = (event: any) => {
      const { nodeId } = event.detail;
      // Remove the node from the nodes array
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Remove all edges connected to this node
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    };

    window.addEventListener('deleteNode', handleDeleteNode);
    return () => window.removeEventListener('deleteNode', handleDeleteNode);
  }, [setNodes, setEdges]);
};
