
import React, { forwardRef, useCallback, useMemo, useEffect, useImperativeHandle } from "react";
import { ReactFlow } from "@xyflow/react";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { useDataFlow } from "@/hooks/workbench/useDataFlow";
import { useDataPreviewSelection } from "@/hooks/workbench/useDataPreviewSelection";
import { usePipelineExecution } from "@/hooks/workbench/usePipelineExecution";
import WorkbenchControls from "./WorkbenchControls";
import ExecutionStatusIndicator from "./ExecutionStatusIndicator";
import FinalOutputPanel from "./FinalOutputPanel";
import { useFlowNodeManager } from "./flow/FlowNodeManager";
import { DocumentInputNode } from "./DocumentInputNode";
import { HelperNode } from "./HelperNode";
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

/**
 * WorkbenchFlow Component
 * 
 * Purpose: Core React Flow implementation for the AI Workbench
 * This component handles the main flow diagram functionality including
 * node management, event handling, user interactions, and pipeline execution.
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

  // Initialize data flow management
  const { getEdgeData, simulateProcessing } = useDataFlow(nodes, edges);

  // Initialize data preview selection
  const { toggleEdgePreview, hideAllPreviews, isEdgeSelected } = useDataPreviewSelection();

  // Initialize pipeline execution
  const {
    isExecuting,
    finalOutput,
    executeAllPipelines,
    resetExecution,
    getNodeExecutionStatus
  } = usePipelineExecution(nodes, edges);

  // Initialize node management
  const { getNodeColor } = useFlowNodeManager();

  /**
   * Listen for settings button clicks from HelperNode components
   */
  useEffect(() => {
    const handleOpenNodeSettings = (event: any) => {
      const { nodeId } = event.detail;
      const node = nodes.find(n => n.id === nodeId) as HelperNode;
      if (node) {
        onModuleEdit(nodeId, node);
      }
    };

    window.addEventListener('openNodeSettings', handleOpenNodeSettings);
    return () => window.removeEventListener('openNodeSettings', handleOpenNodeSettings);
  }, [nodes, onModuleEdit]);

  /**
   * Expose imperative API for adding document nodes from external sources
   */
  useImperativeHandle(ref, () => ({
    addDocumentNode: (file: any) => {
      const nodeId = `doc-${Date.now()}-${file.name}`;
      const position = { x: 80, y: 420 + Math.random() * 100 };
      const newNode: DocumentInputNode = {
        id: nodeId,
        type: "document-input",
        position,
        data: { moduleType: "document-input" as const, documentName: file.name, file },
        draggable: true,
      };
      setNodes((nds) => [...nds, newNode]);
    },
  }));

  /**
   * Handles node clicks for both editing and preview functionality
   */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: AllNodes) => {
      if (node.type === "document-input") {
        // Handle document nodes for preview
        const docNode = node as DocumentInputNode;
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
   * Enhance nodes with execution status indicators
   */
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: getNodeExecutionStatus(node.id)
      }
    }));
  }, [nodes, getNodeExecutionStatus]);

  return (
    <>
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
        />
      </ReactFlow>

      {/* Final output panel */}
      <FinalOutputPanel 
        output={finalOutput}
        onClose={resetExecution}
      />
    </>
  );
});

export default WorkbenchFlow;
