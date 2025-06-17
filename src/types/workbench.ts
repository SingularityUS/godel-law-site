
/**
 * Workbench Type Definitions
 * 
 * Purpose: Centralized type definitions for the AI Workbench system
 * This module contains all shared types used across workbench components
 * and hooks for better type safety and maintainability.
 * 
 * Key Types:
 * - Node data interfaces for different node types
 * - Event handler types for workbench interactions
 * - Configuration types for workbench setup
 * - State management types for hooks
 * 
 * Integration Points:
 * - Used by all workbench components and hooks
 * - Extends React Flow types with custom data structures
 * - Provides type safety for workbench operations
 * - Enables better IDE support and refactoring
 */

import { Node, Edge } from "@xyflow/react";
import { ModuleKind } from "@/data/modules";

// Base node data interface
export interface BaseNodeData {
  moduleType: ModuleKind | "document-input";
}

// Document input node data
export interface DocumentInputNodeData extends BaseNodeData {
  moduleType: "document-input";
  documentName: string;
  file: any;
  isDragOver?: boolean;
}

// Helper node data
export interface HelperNodeData extends BaseNodeData {
  moduleType: ModuleKind;
  promptOverride?: string;
}

// Node type definitions
export type DocumentInputNode = Node<DocumentInputNodeData>;
export type HelperNode = Node<HelperNodeData>;
export type AllNodes = DocumentInputNode | HelperNode;

// Event handler types
export interface WorkbenchEventHandlers {
  onModuleEdit: (nodeId: string, node: HelperNode) => void;
  onNodeClick?: (event: React.MouseEvent, node: AllNodes) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
}

// Workbench configuration
export interface WorkbenchConfig {
  initialNodes: AllNodes[];
  initialEdges: Edge[];
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
}

// Hook return types
export interface WorkbenchState {
  nodes: AllNodes[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export interface WorkbenchEvents extends WorkbenchEventHandlers {
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: any) => void;
}
