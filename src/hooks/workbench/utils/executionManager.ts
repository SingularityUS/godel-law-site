
/**
 * Execution Manager Utility
 * 
 * Purpose: Manages execution order and state tracking for pipeline execution
 */

import { Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { ExecutionState, PipelineResult, FinalLegalOutput } from "../types/pipelineTypes";

export const createExecutionManager = (nodes: AllNodes[], edges: Edge[]) => {
  const getDocumentInputNodes = (): DocumentInputNode[] => {
    return nodes.filter(node => node.data?.moduleType === 'document-input') as DocumentInputNode[];
  };

  const getExecutionOrder = (startNodeId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startNodeId];
    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;

      visited.add(currentNodeId);
      executionOrder.push(currentNodeId);

      // Find connected nodes (targets of edges from current node)
      const connectedEdges = edges.filter(edge => edge.source === currentNodeId);
      const nextNodes = connectedEdges.map(edge => edge.target);
      
      nextNodes.forEach(nodeId => {
        if (!visited.has(nodeId)) {
          queue.push(nodeId);
        }
      });
    }

    return executionOrder;
  };

  const createFinalOutput = (pipelineResults: PipelineResult[], currentData: any): FinalLegalOutput => {
    return {
      summary: {
        documentsProcessed: 1,
        modulesExecuted: pipelineResults.length - 1, // Exclude document input
        processingCompleted: new Date().toISOString(),
        pipelineType: "Legal Document Analysis"
      },
      results: pipelineResults,
      finalOutput: currentData
    };
  };

  const initializeExecutionState = (executionOrder: string[]): ExecutionState => {
    const newExecutionState: ExecutionState = {};
    executionOrder.forEach(nodeId => {
      newExecutionState[nodeId] = { status: 'queued' };
    });
    return newExecutionState;
  };

  return {
    getDocumentInputNodes,
    getExecutionOrder,
    createFinalOutput,
    initializeExecutionState
  };
};
