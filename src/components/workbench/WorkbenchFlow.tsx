
import React, { forwardRef, useCallback } from "react";
import { ReactFlow } from "@xyflow/react";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";
import WorkbenchControls from "./WorkbenchControls";
import { useFlowEventHandlers } from "./flow/FlowEventHandlers";
import { useFlowNodeManager } from "./flow/FlowNodeManager";
import {
  initialNodes,
  initialEdges,
  nodeTypes,
  defaultEdgeOptions,
  flowOptions,
  AllNodes
} from "./flow/FlowConfiguration";

import "@xyflow/react/dist/style.css";

/**
 * WorkbenchFlow Component
 * 
 * Purpose: Core React Flow implementation for the AI Workbench
 * This component handles the main flow diagram functionality including
 * node management, event handling, and user interactions.
 * 
 * Key Responsibilities:
 * - Manages React Flow state and configuration
 * - Handles drag-drop operations from palette and library
 * - Processes node clicks for editing and preview
 * - Provides imperative API for external document addition
 * - Coordinates with event handling hooks
 * 
 * Integration Points:
 * - Uses useWorkbenchEvents for complex event management
 * - Integrates with useModuleColors for visual customization
 * - Communicates with parent components via callbacks
 * - Exposes addDocumentNode method for external use
 */

interface WorkbenchFlowProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, reactFlowWrapper },
  ref
) {
  /**
   * Helper function to get node at coordinates using DOM elements
   * This is used for drag-and-drop operations to find target nodes
   */
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
  }, []);

  // Initialize workbench event handling
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onDrop: handleDrop,
    onDragOver,
    onDragLeave: handleDragLeave,
    onConnect
  } = useWorkbenchEvents({
    initialNodes,
    initialEdges,
    getNodeAtPosition
  });

  // Initialize event handlers
  const { onNodeClick } = useFlowEventHandlers({
    nodes,
    setNodes,
    onModuleEdit,
    ref
  });

  // Initialize node management
  const { getNodeColor } = useFlowNodeManager();

  /**
   * Wraps the drop handler to include container reference
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => handleDrop(event, reactFlowWrapper),
    [handleDrop, reactFlowWrapper]
  );

  /**
   * Wraps the drag leave handler to include container reference
   */
  const onDragLeave = useCallback(
    (event: React.DragEvent) => handleDragLeave(event, reactFlowWrapper),
    [handleDragLeave, reactFlowWrapper]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      {...flowOptions}
    >
      <WorkbenchControls getNodeColor={getNodeColor} />
    </ReactFlow>
  );
});

export default WorkbenchFlow;
