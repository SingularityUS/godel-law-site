
import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import { ReactFlow, Node, Edge } from "@xyflow/react";
import { useWorkbenchDragDrop } from "@/hooks/workbench/useWorkbenchDragDrop";
import { useDataFlow } from "@/hooks/workbench/useDataFlow";
import { useDataPreviewSelection } from "@/hooks/workbench/useDataPreviewSelection";
import { useDragOptimization } from "@/hooks/workbench/useDragOptimization";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";
import WorkbenchControls from "./WorkbenchControls";
import { useFlowEventHandlers } from "./flow/FlowEventHandlers";
import { useFlowNodeManager } from "./flow/FlowNodeManager";
import {
  nodeTypes,
  edgeTypes,
  defaultEdgeOptions,
  flowOptions
} from "./flow/FlowConfiguration";

import "@xyflow/react/dist/style.css";
import "./dataPreview.css";

interface WorkbenchFlowProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  nodes: Node[];
  edges: Edge[];
  updateNodes: (nodes: Node[]) => void;
  updateEdges: (edges: Edge[]) => void;
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, nodes, edges, updateNodes, updateEdges },
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Create a proper getNodeAtPosition function
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
  }, [nodes]);

  // Initialize drag optimization
  const { handleOptimizedNodesChange } = useDragOptimization({ updateNodes });

  // Initialize drag-drop handling with current nodes and direct state setters
  const {
    onDrop: handleDrop,
    onDragOver,
    onDragLeave: handleDragLeave
  } = useWorkbenchDragDrop({
    nodes,
    setNodes: updateNodes,
    getNodeAtPosition
  });

  // Initialize data flow management with memoized values
  const { getEdgeData, simulateProcessing } = useDataFlow(nodes, edges);

  // Initialize data preview selection with memoized callbacks
  const { toggleEdgePreview, hideAllPreviews, isEdgeSelected } = useDataPreviewSelection();

  // Initialize event handlers
  const { onNodeClick } = useFlowEventHandlers({
    nodes,
    setNodes: updateNodes,
    onModuleEdit,
    ref
  });

  // Initialize node management
  const { getNodeColor } = useFlowNodeManager();

  /**
   * Optimized nodes change handler that prevents choppy dragging
   */
  const handleNodesChange = useCallback((changes: any[]) => {
    handleOptimizedNodesChange(changes, nodes);
  }, [handleOptimizedNodesChange, nodes]);

  /**
   * Handle React Flow edge changes and update workspace
   */
  const handleEdgesChange = useCallback((changes: any[]) => {
    const updatedEdges = edges.map(edge => {
      const change = changes.find(c => c.id === edge.id);
      if (!change) return edge;
      
      switch (change.type) {
        case 'remove':
          return null;
        case 'select':
          return { ...edge, selected: change.selected };
        default:
          return edge;
      }
    }).filter(Boolean) as Edge[];
    
    updateEdges(updatedEdges);
  }, [edges, updateEdges]);

  /**
   * Handle new connections between nodes
   */
  const handleConnect = useCallback((connection: any) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: true,
      type: "dataPreview",
      data: { label: "JSON" }
    };
    
    updateEdges([...edges, newEdge]);
  }, [edges, updateEdges]);

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
   * Memoized enhanced edges to prevent flickering
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
        onConnect={handleConnect}
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
