
/**
 * usePipelineExecution Hook
 * 
 * Purpose: Orchestrates sequential execution of AI modules in the workbench
 * Refactored to use smaller, focused hooks for better maintainability
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes } from "@/types/workbench";
import { createExecutionManager } from "./utils/executionManager";
import { usePipelineExecutor } from "./usePipelineExecutor";

export const usePipelineExecution = (nodes: AllNodes[], edges: Edge[]) => {
  const {
    executePipeline,
    executionState,
    isExecuting,
    finalOutput,
    progressInfo,
    getNodeExecutionStatus,
    resetState
  } = usePipelineExecutor(nodes, edges);

  // Create execution manager for utility functions
  const executionManager = createExecutionManager(nodes, edges);

  /**
   * Execute all pipelines (from all document input nodes)
   */
  const executeAllPipelines = useCallback(async () => {
    const docInputNodes = executionManager.getDocumentInputNodes();
    
    if (docInputNodes.length === 0) {
      console.warn('No document input nodes found');
      return;
    }

    // For now, execute the first pipeline found
    await executePipeline(docInputNodes[0].id);
  }, [executePipeline, executionManager]);

  /**
   * Get execution status for a specific node with progress
   */
  const getNodeExecutionStatusWithProgress = useCallback((nodeId: string) => {
    const baseStatus = getNodeExecutionStatus(nodeId);
    const progress = progressInfo[nodeId];
    
    return {
      ...baseStatus,
      progress: progress ? `${progress.completed}/${progress.total}` : undefined
    };
  }, [getNodeExecutionStatus, progressInfo]);

  /**
   * Reset execution state
   */
  const resetExecution = useCallback(() => {
    resetState();
  }, [resetState]);

  return {
    executionState,
    isExecuting,
    finalOutput,
    progressInfo,
    executeAllPipelines,
    executePipeline,
    getNodeExecutionStatus: getNodeExecutionStatusWithProgress,
    resetExecution,
    getDocumentInputNodes: executionManager.getDocumentInputNodes,
    getExecutionOrder: executionManager.getExecutionOrder
  };
};
