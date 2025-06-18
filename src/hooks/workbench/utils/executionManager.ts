
/**
 * Execution Manager Utility
 * 
 * Purpose: Enhanced execution order and state tracking with endpoint support
 */

import { Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { ExecutionState, PipelineResult, FinalLegalOutput } from "../types/pipelineTypes";
import { PipelineEndpoint } from "./endpointDetector";

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

  /**
   * Create enhanced final output with endpoint data preserved
   */
  const createEnhancedFinalOutput = (
    pipelineResults: PipelineResult[], 
    currentData: any,
    endpoints: PipelineEndpoint[],
    allModuleData: Map<string, any>
  ): FinalLegalOutput => {
    // Filter results to get only endpoint module data
    const endpointResults = pipelineResults.filter(result => 
      endpoints.some(endpoint => endpoint.nodeId === result.nodeId)
    );

    return {
      summary: {
        documentsProcessed: 1,
        modulesExecuted: pipelineResults.length - 1,
        processingCompleted: new Date().toISOString(),
        pipelineType: "Legal Document Analysis",
        endpointCount: endpoints.length
      },
      results: pipelineResults,
      endpointResults, // New: preserved endpoint data for redline generation
      endpoints, // New: endpoint metadata
      finalOutput: currentData,
      pipelineResults // Maintain compatibility while adding enhanced data
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
    createEnhancedFinalOutput,
    initializeExecutionState
  };
};
