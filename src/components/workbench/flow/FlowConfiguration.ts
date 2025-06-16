
/**
 * Flow Configuration Module
 * 
 * Purpose: Centralized configuration for React Flow setup
 * This module contains all the static configuration needed for the React Flow
 * instance including node types, initial workflow, and default settings.
 * 
 * Key Responsibilities:
 * - Defines initial nodes and edges for default workflow
 * - Registers custom node types with React Flow
 * - Provides default edge configuration
 * - Maintains type definitions for flow nodes
 * 
 * Integration Points:
 * - Used by WorkbenchFlow for React Flow initialization
 * - Imported by components that need node type definitions
 * - Referenced by event handlers for node creation
 * - Coordinates with custom node components
 * 
 * Architecture Benefits:
 * - Separates configuration from business logic
 * - Provides single source of truth for flow setup
 * - Enables easy modification of default workflow
 * - Simplifies testing of configuration values
 */

import { Node, Edge } from "@xyflow/react";
import { HelperNode } from "../HelperNode";
import { DocumentInputNode } from "../DocumentInputNode";

// Union type for all supported node types
export type AllNodes = HelperNode | DocumentInputNode;

// Default workflow configuration
export const initialNodes: HelperNode[] = [
  {
    id: "1",
    type: "helper",
    position: { x: 100, y: 220 },
    data: { moduleType: "text-extractor" },
  },
  {
    id: "2",
    type: "helper",
    position: { x: 350, y: 220 },
    data: { moduleType: "paragraph-splitter" },
  },
  {
    id: "3",
    type: "helper",
    position: { x: 600, y: 220 },
    data: { moduleType: "grammar-checker" },
  },
];

export const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, type: "smoothstep", data: { label: "JSON" } },
  { id: "e2-3", source: "2", target: "3", animated: true, type: "smoothstep", data: { label: "JSON" } },
];

// Register custom node types with React Flow
export const nodeTypes = {
  helper: require("../HelperNode").default,
  "document-input": require("../DocumentInputNode").default,
};

// Default edge configuration
export const defaultEdgeOptions = { 
  type: "smoothstep", 
  animated: true, 
  style: { stroke: "#333" } 
};

// React Flow configuration options
export const flowOptions = {
  fitView: true,
  panOnScroll: true,
  proOptions: { hideAttribution: true },
};
