
import { Node } from "@xyflow/react";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";

/**
 * Node Utilities
 * 
 * Purpose: Provides utility functions for node operations and calculations
 * These functions handle common operations needed by the workbench components
 * without cluttering the main component logic.
 * 
 * Functions:
 * - getModuleDef: Retrieves module definition by type
 * - createNodeAtPosition: Helper for positioning nodes based on screen coordinates
 * - getNodeAtScreenPosition: Finds nodes at specific screen coordinates
 * 
 * Integration:
 * - Used by AIWorkbench and related components
 * - Provides abstraction for node manipulation
 * - Centralizes node-related calculations
 */

/**
 * Retrieves module definition from the modules registry
 * @param type - The module type to look up
 * @returns Module definition object
 */
export const getModuleDef = (type: ModuleKind) => 
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

/**
 * Creates a node position based on screen coordinates and container bounds
 * @param clientX - Mouse X coordinate
 * @param clientY - Mouse Y coordinate
 * @param containerBounds - Container element bounds
 * @param offsetX - X offset for positioning (default: 75)
 * @param offsetY - Y offset for positioning (default: 30)
 * @returns Position object with x and y coordinates
 */
export const createNodePosition = (
  clientX: number,
  clientY: number,
  containerBounds: DOMRect | null,
  offsetX: number = 75,
  offsetY: number = 30
) => {
  if (containerBounds) {
    return {
      x: clientX - containerBounds.left - offsetX,
      y: clientY - containerBounds.top - offsetY,
    };
  }
  // Fallback position if container bounds not available
  return { x: 100, y: 100 };
};

/**
 * Finds a node at the given screen coordinates
 * @param nodes - Array of nodes to search through
 * @param clientX - Screen X coordinate
 * @param clientY - Screen Y coordinate
 * @param containerBounds - Container element bounds
 * @returns Found node or null
 */
export const getNodeAtScreenPosition = (
  nodes: Node[],
  clientX: number,
  clientY: number,
  containerBounds: DOMRect | null
) => {
  if (!containerBounds) return null;
  
  // Convert screen coordinates to flow coordinates
  const flowX = clientX - containerBounds.left;
  const flowY = clientY - containerBounds.top;
  
  // Find node that contains this point (approximate check)
  return nodes.find(node => {
    const nodeWidth = 180; // approximate node width
    const nodeHeight = 80; // approximate node height
    return (
      flowX >= node.position.x &&
      flowX <= node.position.x + nodeWidth &&
      flowY >= node.position.y &&
      flowY <= node.position.y + nodeHeight
    );
  }) || null;
};

/**
 * Generates a unique node ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique node ID string
 */
export const generateNodeId = (prefix: string = 'node') => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
