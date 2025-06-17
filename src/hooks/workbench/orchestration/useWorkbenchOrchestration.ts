
/**
 * useWorkbenchOrchestration Hook
 * 
 * Purpose: Coordinates all workbench functionality and provides unified interface
 */

import { useCallback, useEffect, useImperativeHandle } from "react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { useDataFlow } from "../useDataFlow";
import { useDataPreviewSelection } from "../useDataPreviewSelection";
import { usePipelineExecution } from "../usePipelineExecution";
import { useFlowNodeManager } from "../../components/workbench/flow/FlowNodeManager";

interface UseWorkbenchOrchestrationProps {
  nodes: AllNodes[];
  edges: any[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  onModuleEdit: (nodeId: string, node: any) => void;
  ref?: React.Ref<any>;
}

export const useWorkbenchOrchestration = ({
  nodes,
  edges,
  setNodes,
  onModuleEdit,
  ref
}: UseWorkbenchOrchestrationProps) => {
  
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
      const node = nodes.find(n => n.id === nodeId);
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

  return {
    // Data flow
    getEdgeData,
    simulateProcessing,
    
    // Preview management
    toggleEdgePreview,
    hideAllPreviews,
    isEdgeSelected,
    handleClosePreview,
    
    // Pipeline execution
    isExecuting,
    finalOutput,
    executeAllPipelines,
    resetExecution,
    getNodeExecutionStatus,
    
    // Node management
    getNodeColor,
    
    // Event handlers
    handlePaneClick
  };
};
