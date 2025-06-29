
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

import { Edge } from "@xyflow/react";
import { HelperNode, AllNodes } from "@/types/workbench";
import HelperNodeComponent from "../HelperNode";
import DocumentInputNodeComponent from "../DocumentInputNode";
import DataPreviewEdge from "../DataPreviewEdge";

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
  { 
    id: "e1-2", 
    source: "1", 
    target: "2", 
    animated: true, 
    type: "dataPreview",
    data: { label: "JSON" } 
  },
  { 
    id: "e2-3", 
    source: "2", 
    target: "3", 
    animated: true, 
    type: "dataPreview",
    data: { label: "JSON" } 
  },
];

// Register custom node types with React Flow
export const nodeTypes = {
  helper: HelperNodeComponent,
  "document-input": DocumentInputNodeComponent,
};

// Register custom edge types with React Flow
export const edgeTypes = {
  dataPreview: DataPreviewEdge,
};

// Default edge configuration
export const defaultEdgeOptions = { 
  type: "dataPreview", 
  animated: true, 
  style: { stroke: "#333" } 
};

// React Flow configuration options
export const flowOptions = {
  fitView: true,
  panOnScroll: true,
  proOptions: { hideAttribution: true },
};

// Re-export types for backward compatibility
export type { AllNodes };
