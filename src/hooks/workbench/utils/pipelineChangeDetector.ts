
/**
 * Pipeline Change Detection System
 * 
 * Purpose: Detects when pipeline composition changes to clear old redline documents
 */

export interface PipelineSignature {
  nodeIds: string[];
  edgeConnections: string[];
  timestamp: number;
}

export class PipelineChangeDetector {
  private static lastSignature: PipelineSignature | null = null;
  
  /**
   * Create a signature for the current pipeline state
   */
  static createPipelineSignature(nodes: any[], edges: any[]): PipelineSignature {
    const nodeIds = nodes
      .filter(node => node.data?.moduleType !== 'document-input')
      .map(node => `${node.id}:${node.data?.moduleType}`)
      .sort();
    
    const edgeConnections = edges
      .map(edge => `${edge.source}->${edge.target}`)
      .sort();
    
    return {
      nodeIds,
      edgeConnections,
      timestamp: Date.now()
    };
  }
  
  /**
   * Check if the pipeline has changed since last execution
   */
  static hasPipelineChanged(nodes: any[], edges: any[]): boolean {
    const currentSignature = this.createPipelineSignature(nodes, edges);
    
    if (!this.lastSignature) {
      console.log('No previous pipeline signature, considering as changed');
      this.lastSignature = currentSignature;
      return true;
    }
    
    const nodeIdsChanged = JSON.stringify(this.lastSignature.nodeIds) !== JSON.stringify(currentSignature.nodeIds);
    const edgeConnectionsChanged = JSON.stringify(this.lastSignature.edgeConnections) !== JSON.stringify(currentSignature.edgeConnections);
    
    const hasChanged = nodeIdsChanged || edgeConnectionsChanged;
    
    if (hasChanged) {
      console.log('Pipeline has changed:', {
        nodeIdsChanged,
        edgeConnectionsChanged,
        previousNodes: this.lastSignature.nodeIds,
        currentNodes: currentSignature.nodeIds,
        previousEdges: this.lastSignature.edgeConnections,
        currentEdges: currentSignature.edgeConnections
      });
      this.lastSignature = currentSignature;
    }
    
    return hasChanged;
  }
  
  /**
   * Reset the pipeline signature (force next check to return true)
   */
  static resetSignature(): void {
    this.lastSignature = null;
    console.log('Pipeline signature reset');
  }
}
