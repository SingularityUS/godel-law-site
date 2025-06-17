
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { ReactFlow } from "@xyflow/react";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { useDataFlow } from "@/hooks/workbench/useDataFlow";
import { useDataPreviewSelection } from "@/hooks/workbench/useDataPreviewSelection";
import { useWorkflowExecution } from "@/hooks/workbench/useWorkflowExecution";
import { useWorkspaceManager } from "@/hooks/workbench/useWorkspaceManager";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";
import WorkbenchControls from "./WorkbenchControls";
import RunWorkflowButton from "./RunWorkflowButton";
import WorkflowOutput from "./WorkflowOutput";
import { useFlowEventHandlers } from "./flow/FlowEventHandlers";
import { useFlowNodeManager } from "./flow/FlowNodeManager";
import { toast } from "sonner";
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
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, reactFlowWrapper },
  ref
) {
  // Initialize workbench event handling FIRST
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
    getNodeAtPosition: (x: number, y: number) => {
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
    }
  });

  // Add new state for output display
  const [showOutput, setShowOutput] = useState(false);
  
  // Initialize new hooks
  const { 
    executionState, 
    executionHistory, 
    executeWorkflow, 
    resetExecution 
  } = useWorkflowExecution();
  
  const { autoSave } = useWorkspaceManager();

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
   * Handle workflow execution
   */
  const handleRunWorkflow = useCallback(async () => {
    try {
      // Auto-save workspace before execution
      toast.loading("Saving workspace...");
      await autoSave(nodes, edges);
      toast.dismiss();
      toast.success("Workspace saved!");
      
      // Start workflow execution
      await executeWorkflow(nodes, edges);
      
      // Show output when execution completes
      setShowOutput(true);
    } catch (error: any) {
      toast.error(`Execution failed: ${error.message}`);
    }
  }, [nodes, edges, autoSave, executeWorkflow]);

  /**
   * Handle stopping workflow execution
   */
  const handleStopWorkflow = useCallback(() => {
    resetExecution();
    toast.info("Workflow execution stopped");
  }, [resetExecution]);

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
   * Enhance nodes with execution state
   */
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isProcessing: executionState.currentModuleId === node.id,
        isCompleted: executionState.completedModules.has(node.id),
        hasError: executionState.error && executionState.currentModuleId === node.id
      }
    }));
  }, [nodes, executionState]);

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
    <>
      <div className="relative">
        {/* Run Workflow Button - positioned in upper right */}
        <div className="absolute top-4 right-4 z-10">
          <RunWorkflowButton
            onRun={handleRunWorkflow}
            onStop={handleStopWorkflow}
            executionState={executionState}
            disabled={nodes.length === 0}
          />
        </div>

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
          <WorkbenchControls getNodeColor={getNodeColor} />
        </ReactFlow>
      </div>

      {/* Workflow Output Modal */}
      <WorkflowOutput
        isOpen={showOutput}
        onClose={() => setShowOutput(false)}
        finalOutput={executionState.finalOutput}
        executionHistory={executionHistory}
      />
    </>
  );
});

export default WorkbenchFlow;
