
/**
 * useTopologicalSort Hook
 * 
 * Purpose: Calculates execution order using topological sorting
 * Handles dependency resolution and cycle detection
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";

export const useTopologicalSort = () => {
  /**
   * Calculate execution order using topological sort
   */
  const calculateExecutionOrder = useCallback((nodes: Node[], edges: Edge[]) => {
    // Find document input nodes (starting points)
    const documentNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    if (documentNodes.length === 0) {
      throw new Error('No document input nodes found. Please add a document to start the workflow.');
    }

    // Build adjacency list from edges
    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    // Initialize
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
      inDegree[node.id] = 0;
    });

    // Build graph
    edges.forEach(edge => {
      adjacencyList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });

    // Topological sort using Kahn's algorithm
    const queue = Object.keys(inDegree).filter(nodeId => inDegree[nodeId] === 0);
    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      executionOrder.push(current);

      adjacencyList[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (executionOrder.length !== nodes.length) {
      throw new Error('Workflow contains cycles. Please check your connections.');
    }

    return executionOrder;
  }, []);

  /**
   * Check if workflow is valid for execution
   */
  const isWorkflowValid = useCallback((nodes: Node[], edges: Edge[]) => {
    try {
      calculateExecutionOrder(nodes, edges);
      return true;
    } catch {
      return false;
    }
  }, [calculateExecutionOrder]);

  return {
    calculateExecutionOrder,
    isWorkflowValid
  };
};
