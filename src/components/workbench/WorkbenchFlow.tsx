
import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import { ReactFlow, Node, Edge } from "@xyflow/react";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { useDataFlow } from "@/hooks/workbench/useDataFlow";
import { useDataPreviewSelection } from "@/hooks/workbench/useDataPreviewSelection";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";
import WorkbenchControls from "./WorkbenchControls";
import { useFlowEventHandlers } from "./flow/FlowEventHandlers";
import { useFlowNodeManager } from "./flow/FlowNodeManager";
import {
  nodeTypes,
  edgeTypes,
  defaultEdgeOptions,
  flowOptions,
  AllNodes
} from "./flow/FlowConfiguration";

import "@xyflow/react/dist/style.css";
import "./dataPreview.css";

interface WorkbenchFlowProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  nodes: AllNodes[];
  edges: Edge[];
  onNodesChange: (nodes: AllNodes[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, nodes, edges, onNodesChange, onEdgesChange },
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Create a proper getNodeAtPosition function
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
  }, [nodes]);

  // Initialize workbench event handling with persistent state
  const {
    setNodes,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onDrop: handleDrop,
    onDragOver,
    onDragLeave: handleDragLeave,
    onConnect
  } = useWorkbenchEvents({
    initialNodes: nodes,
    initialEdges: edges,
    getNodeAtPosition
  });

  // Update parent when nodes/edges change
  React.useEffect(() => {
    onNodesChange(nodes);
  }, [nodes, onNodesChange]);

  React.useEffect(() => {
    onEdgesChange(edges);
  }, [edges, onEdgesChange]);

  // Initialize data flow management
  const { getEdgeData, simulateProcessing } = useDataFlow(nodes, edges);

  // Initialize data preview selection
  const { toggleEdgePreview, hideAllPreviews, isEdgeSelected } = useDataPreviewSelection();

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
   * Enhanced node click handler that also hides data previews
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      hideAllPreviews();
      onNodeClick(event, node);
    },
    [onNodeClick, hideAllPreviews]
  );

  /**
   * Handle clicks on empty workspace to hide previews
   */
  const handlePaneClick = useCallback(() => {
    hideAllPreviews();
  }, [hideAllPreviews]);

  /**
   * Handle closing specific edge preview
   */
  const handleClosePreview = useCallback((edgeId: string) => {
    hideAllPreviews();
  }, [hideAllPreviews]);

  /**
   * Enhance edges with data preview functionality and selection state
   */
  const enhancedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        edgeData: getEdgeData(edge.id),
        onSimulateProcessing: () => simulateProcessing(edge.id),
        isSelected: isEdgeSelected(edge.id),
        onEdgeClick: toggleEdgePreview,
        onClosePreview: handleClosePreview
      }
    }));
  }, [edges, getEdgeData, simulateProcessing, isEdgeSelected, toggleEdgePreview, handleClosePreview]);

  /**
   * Wraps the drop handler to include container reference
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => handleDrop(event, reactFlowWrapper),
    [handleDrop]
  );

  /**
   * Wraps the drag leave handler to include container reference
   */
  const onDragLeave = useCallback(
    (event: React.DragEvent) => handleDragLeave(event, reactFlowWrapper),
    [handleDragLeave]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={enhancedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        {...flowOptions}
      >
        <WorkbenchControls getNodeColor={getNodeColor} />
      </ReactFlow>
    </div>
  );
});

export default WorkbenchFlow;
