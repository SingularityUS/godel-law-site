
/**
 * useWorkbenchKeyboard Hook
 * 
 * Purpose: Manages keyboard event handling for the AI Workbench
 * This hook provides keyboard shortcuts and interactions for
 * common workbench operations like node deletion.
 * 
 * Key Responsibilities:
 * - Handles Delete/Backspace keys for node deletion
 * - Manages selected node removal and edge cleanup
 * - Provides standard keyboard interaction patterns
 * - Maintains accessibility through keyboard navigation
 * 
 * Integration Points:
 * - Uses workbench state for node and edge management
 * - Coordinates with React Flow's selection system
 * - Handles standard desktop application patterns
 * - Manages state consistency during operations
 * 
 * Keyboard Shortcuts:
 * - Delete/Backspace: Remove selected nodes and connected edges
 * - Future: Could be extended for copy/paste, undo/redo, etc.
 */

import { useEffect } from "react";
import { Node, Edge } from "@xyflow/react";

// Type definition for all supported node types in the workbench
type AllNodes = Node<any>;

interface UseWorkbenchKeyboardProps {
  nodes: AllNodes[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useWorkbenchKeyboard = ({
  nodes,
  setNodes,
  setEdges
}: UseWorkbenchKeyboardProps) => {

  /**
   * Keyboard Event Handler: Node Deletion via Keyboard
   * 
   * Implements standard Delete/Backspace functionality for selected nodes
   * Removes both selected nodes and any edges connected to them
   * 
   * Flow:
   * 1. Listen for Delete or Backspace key press
   * 2. Find all selected nodes in current state
   * 3. Remove selected nodes from nodes array
   * 4. Remove edges that connect to any deleted nodes
   */
  useEffect(() => {
    const handleDelete = (ev: KeyboardEvent) => {
      if (ev.key === "Backspace" || ev.key === "Delete") {
        // Remove selected nodes
        setNodes((nds) => nds.filter((n) => !n.selected));
        // Remove edges connected to selected nodes
        setEdges((eds) =>
          eds.filter(
            (edge) =>
              !nodes.find((n) => n.selected && (n.id === edge.source || n.id === edge.target))
          )
        );
      }
    };
    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [setNodes, setEdges, nodes]);
};
