
/**
 * Pipeline Types
 * 
 * Purpose: Enhanced type definitions for pipeline execution and results
 */

export interface ExecutionState {
  [nodeId: string]: {
    status: 'queued' | 'processing' | 'completed' | 'error';
    data?: any;
    error?: string;
    processingTime?: number;
  };
}

export interface PipelineResult {
  nodeId: string;
  moduleType: string;
  result: any;
  isEndpoint?: boolean;
}

export interface PipelineSummary {
  documentsProcessed: number;
  modulesExecuted: number;
  processingCompleted: string;
  pipelineType: string;
  endpointCount?: number;
}

export interface FinalLegalOutput {
  summary: PipelineSummary;
  results: PipelineResult[];
  endpointResults?: PipelineResult[];
  endpoints?: any[];
  finalOutput: any;
  pipelineResults?: PipelineResult[];
}
