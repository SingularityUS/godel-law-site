
/**
 * Pipeline Endpoint Detection Utility
 * 
 * Purpose: Detects terminal nodes (endpoints) in the pipeline that should contribute to redline generation
 */

import { AllNodes } from "@/types/workbench";
import { Edge } from "@xyflow/react";

export interface PipelineEndpoint {
  nodeId: string;
  moduleType: string;
  hasOutgoingConnections: boolean;
}

export const createEndpointDetector = (nodes: AllNodes[], edges: Edge[]) => {
  
  /**
   * Get all pipeline endpoint modules (nodes without outgoing connections)
   */
  const getPipelineEndpoints = (): PipelineEndpoint[] => {
    console.log('=== DETECTING PIPELINE ENDPOINTS ===');
    
    const endpoints: PipelineEndpoint[] = [];
    
    // Find all nodes that are not document-input nodes
    const processingNodes = nodes.filter(node => node.data?.moduleType !== 'document-input');
    
    processingNodes.forEach(node => {
      // Check if this node has any outgoing edges
      const hasOutgoingConnections = edges.some(edge => edge.source === node.id);
      
      const endpoint: PipelineEndpoint = {
        nodeId: node.id,
        moduleType: node.data?.moduleType || 'unknown',
        hasOutgoingConnections
      };
      
      // If no outgoing connections, this is an endpoint
      if (!hasOutgoingConnections) {
        endpoints.push(endpoint);
        console.log(`Found endpoint: ${node.id} (${endpoint.moduleType})`);
      }
    });
    
    console.log(`Total endpoints detected: ${endpoints.length}`);
    return endpoints;
  };

  /**
   * Check if a specific node is an endpoint
   */
  const isEndpointNode = (nodeId: string): boolean => {
    const endpoints = getPipelineEndpoints();
    return endpoints.some(endpoint => endpoint.nodeId === nodeId);
  };

  /**
   * Get endpoint node IDs for filtering pipeline results
   */
  const getEndpointNodeIds = (): string[] => {
    return getPipelineEndpoints().map(endpoint => endpoint.nodeId);
  };

  return {
    getPipelineEndpoints,
    isEndpointNode,
    getEndpointNodeIds
  };
};
