
/**
 * Pipeline Types
 * 
 * Purpose: Type definitions for pipeline execution system
 */

export interface ExecutionState {
  [nodeId: string]: {
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
    data?: any;
    error?: string;
    processingTime?: number;
    debugInfo?: {
      totalItems?: number;
      processedItems?: number;
      itemType?: string;
      isPassThrough?: boolean;
      isDeprecated?: boolean;
      progress?: string;
      contentLength?: number;
      hasChunks?: boolean;
      chunkCount?: number;
      batchesProcessed?: number;
      model?: string;
    };
  };
}

export interface PipelineResult {
  nodeId: string;
  moduleType: string;
  result: any;
}

export interface ProgressInfo {
  [nodeId: string]: {
    completed: number;
    total: number;
  };
}
