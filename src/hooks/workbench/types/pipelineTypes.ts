
/**
 * Pipeline Execution Types
 * 
 * Purpose: Type definitions for pipeline execution system
 */

export interface ExecutionState {
  [nodeId: string]: {
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
    data?: any;
    error?: string;
    progress?: string;
    processingTime?: number;
  };
}

export interface PipelineResult {
  nodeId: string;
  moduleType: string;
  result: any;
}

export interface FinalLegalOutput {
  summary: {
    documentsProcessed: number;
    modulesExecuted: number;
    processingCompleted: string;
    pipelineType: string;
  };
  results: PipelineResult[];
  finalOutput: any;
  documentExtractionResult?: any;
  metadata?: any;
}
