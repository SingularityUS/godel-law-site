
/**
 * Node Utilities Module
 * 
 * Purpose: Centralized utility functions for node operations and calculations
 * This module provides reusable functions for common node manipulation tasks,
 * coordinate calculations, and node management operations used throughout
 * the workbench components.
 * 
 * Design Philosophy:
 * - Pure functions where possible for predictable behavior
 * - Separation of concerns: keeps calculation logic out of UI components
 * - Reusable abstractions for common node operations
 * - Type-safe interfaces for all utility functions
 * 
 * Integration Points:
 * - Used by AIWorkbench for position calculations and node lookups
 * - Imported by useWorkbenchEvents for coordinate transformations
 * - Utilized by drag-and-drop handlers for precise positioning
 * - Referenced by node components for consistent behavior
 * 
 * Function Categories:
 * 1. Module Definition Lookups: Access to module registry
 * 2. Position Calculations: Screen to flow coordinate transformations
 * 3. Node Detection: Finding nodes at specific coordinates
 * 4. ID Generation: Unique identifier creation
 */

import { Node } from "@xyflow/react";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";

/**
 * Module Definition Lookup
 * 
 * Retrieves module definition from the centralized module registry
 * Provides access to module metadata including icons, labels, and default prompts
 * 
 * Usage Pattern:
 * - Called by components that need to display module information
 * - Used in settings drawers to show module details
 * - Referenced during node creation for default configurations
 * 
 * @param type - The module type identifier from ModuleKind enum
 * @returns Complete module definition object with all metadata
 * @throws Error if module type is not found in registry
 */
export const getModuleDef = (type: ModuleKind) => {
  const definition = MODULE_DEFINITIONS.find((m) => m.type === type);
  if (!definition) {
    throw new Error(`Module definition not found for type: ${type}`);
  }
  return definition;
};

/**
 * Position Calculation for Node Creation
 * 
 * Converts screen coordinates (from mouse events) to React Flow coordinate system
 * Accounts for container positioning and applies configurable offsets for proper
 * node placement during drag-and-drop operations
 * 
 * Coordinate System Notes:
 * - Screen coordinates: Relative to viewport (0,0 at top-left of screen)
 * - Container coordinates: Relative to React Flow container
 * - Flow coordinates: React Flow's internal coordinate system
 * 
 * @param clientX - Mouse X coordinate in screen space
 * @param clientY - Mouse Y coordinate in screen space
 * @param containerBounds - DOMRect of the React Flow container
 * @param offsetX - X offset for centering node on cursor (default: 75)
 * @param offsetY - Y offset for centering node on cursor (default: 30)
 * @returns Position object with x,y coordinates in flow space
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
  // Fallback position when container bounds are unavailable
  // Uses random offset to prevent nodes from stacking exactly
  return { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 };
};

/**
 * Node Detection at Screen Position
 * 
 * Finds a node that contains the given screen coordinates
 * Used for drag-over detection and drop target identification
 * 
 * Algorithm:
 * 1. Convert screen coordinates to flow coordinates using container bounds
 * 2. Iterate through all nodes checking for coordinate overlap
 * 3. Use approximate node dimensions for hit detection
 * 4. Return first matching node (topmost in z-order)
 * 
 * Performance Notes:
 * - O(n) complexity where n is number of nodes
 * - Acceptable for typical workflow sizes (<100 nodes)
 * - Could be optimized with spatial indexing for large workflows
 * 
 * @param nodes - Array of all nodes in the current workflow
 * @param clientX - Screen X coordinate to test
 * @param clientY - Screen Y coordinate to test
 * @param containerBounds - DOMRect of the React Flow container
 * @returns Node at the specified position or null if none found
 */
export const getNodeAtScreenPosition = (
  nodes: Node[],
  clientX: number,
  clientY: number,
  containerBounds: DOMRect | null
): Node | null => {
  if (!containerBounds) return null;
  
  // Convert screen coordinates to flow coordinate system
  const flowX = clientX - containerBounds.left;
  const flowY = clientY - containerBounds.top;
  
  // Standard node dimensions for hit detection
  // These approximate the actual rendered node sizes
  const nodeWidth = 180;  // Helper nodes: ~150px, Document nodes: ~130px
  const nodeHeight = 80;  // Both node types: ~80px
  
  // Find node that contains the specified point
  return nodes.find(node => {
    return (
      flowX >= node.position.x &&
      flowX <= node.position.x + nodeWidth &&
      flowY >= node.position.y &&
      flowY <= node.position.y + nodeHeight
    );
  }) || null;
};

/**
 * Unique Node ID Generation
 * 
 * Creates guaranteed unique identifiers for new nodes
 * Combines timestamp and random component to prevent collisions
 * 
 * ID Format: {prefix}-{timestamp}-{random}
 * Example: "node-1640995200000-123" or "doc-1640995200000-456"
 * 
 * Collision Resistance:
 * - Timestamp provides millisecond precision
 * - Random component (0-999) handles rapid creation
 * - Prefix provides semantic context
 * 
 * @param prefix - Optional prefix for semantic identification (default: 'node')
 * @returns Unique node ID string suitable for React Flow
 */
export const generateNodeId = (prefix: string = 'node'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Node Type Validation
 * 
 * Validates if a node conforms to expected type structure
 * Useful for type checking during dynamic node operations
 * 
 * @param node - Node object to validate
 * @param expectedType - Expected node type string
 * @returns Boolean indicating if node matches expected type
 */
export const isNodeType = (node: Node, expectedType: string): boolean => {
  return node.type === expectedType && node.data && typeof node.data === 'object';
};

/**
 * Node Position Validation
 * 
 * Ensures node position is within reasonable bounds
 * Prevents nodes from being placed in inaccessible areas
 * 
 * @param position - Position object with x,y coordinates
 * @param maxX - Maximum allowed X coordinate (default: 5000)
 * @param maxY - Maximum allowed Y coordinate (default: 5000)
 * @returns Clamped position within bounds
 */
export const validateNodePosition = (
  position: { x: number; y: number },
  maxX: number = 5000,
  maxY: number = 5000
) => {
  return {
    x: Math.max(0, Math.min(position.x, maxX)),
    y: Math.max(0, Math.min(position.y, maxY))
  };
};
