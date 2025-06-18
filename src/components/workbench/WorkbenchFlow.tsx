
/**
 * WorkbenchFlow Component
 * 
 * Purpose: Core React Flow implementation for the AI Workbench
 * Refactored to use orchestration hooks for better organization
 */

import React, { forwardRef, useCallback } from "react";
import { ReactFlow } from "@xyflow/react";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { useWorkbenchOrchestration } from "@/hooks/workbench/orchestration/useWorkbenchOrchestration";
import { useNodeEnhancement } from "@/hooks/workbench/orchestration/useNodeEnhancement";
import { useEdgeEnhancement } from "@/hooks/workbench/orchestration/useEdgeEnhancement";
import WorkbenchControls from "./WorkbenchControls";
import {
  initialNodes,
  initialEdges,
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
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  onOpenSidebar: () => void;
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, reactFlowWrapper, onOpenSidebar },
  ref
) => {
  // Initialize workbench event handling
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onDrop,
    onDragOver,
    onDragLeave,
    onConnect
  } = useWorkbenchEvents({
    initialNodes,
    initialEdges,
    reactFlowWrapper
  });

  // Initialize orchestration
  const {
    getEdgeData,
    simulateProcessing,
    toggleEdgePreview,
    hideAllPreviews,
    isEdgeSelected,
    handleClosePreview,
    isExecuting,
    finalOutput,
    executeAllPipelines,
    resetExecution,
    getNodeExecutionStatus,
    getNodeColor,
    handlePaneClick
  } = useWorkbenchOrchestration({
    nodes,
    edges,
    setNodes,
    onModuleEdit,
    ref
  });

  // Emit pipeline completion events when finalOutput changes
  React.useEffect(() => {
    if (finalOutput) {
      console.log('Emitting pipeline completion event with output:', finalOutput);
      const event = new CustomEvent('pipelineCompleted', {
        detail: finalOutput
      });
      window.dispatchEvent(event);
    }
  }, [finalOutput]);

  // Enhance nodes with execution status
  const { enhancedNodes } = useNodeEnhancement({
    nodes,
    getNodeExecutionStatus
  });

  // Enhance edges with data preview functionality
  const { enhancedEdges } = useEdgeEnhancement({
    edges,
    getEdgeData,
    simulateProcessing,
    isEdgeSelected,
    toggleEdgePreview,
    handleClosePreview
  });

  /**
   * Handles node clicks for both editing and preview functionality
   */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: AllNodes) => {
      if (node.type === "document-input") {
        // Handle document nodes for preview
        const docNode = node as any;
        if (docNode.data?.file) {
          const previewEvent = new CustomEvent('openDocumentPreview', {
            detail: {
              name: docNode.data.documentName,
              type: docNode.data.file.type,
              size: docNode.data.file.size,
              preview: docNode.data.file.preview,
              file: docNode.data.file
            }
          });
          window.dispatchEvent(previewEvent);
        }
      }
    },
    []
  );

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

  return (
    <ReactFlow
      nodes={enhancedNodes}
      edges={enhancedEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
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
      <WorkbenchControls 
        getNodeColor={getNodeColor}
        nodes={nodes}
        edges={edges}
        isExecuting={isExecuting}
        onExecutePipeline={executeAllPipelines}
        onStopPipeline={resetExecution}
        onOpenSidebar={onOpenSidebar}
      />
    </ReactFlow>
  );
});

export default WorkbenchFlow;
