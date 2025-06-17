
/**
 * usePipelineExecution Hook
 * 
 * Purpose: Orchestrates sequential execution of AI modules in the workbench
 * Enhanced for large document processing with chunking and progress tracking
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { useChatGPTApi } from "./useChatGPTApi";
import { ExecutionState } from "./types/pipelineTypes";
import { extractDocumentText } from "./utils/documentProcessor";
import { createNodeProcessor } from "./utils/nodeProcessor";
import { createExecutionManager } from "./utils/executionManager";
import { shouldUseBatchProcessing } from "./utils/batchProcessor";

export const usePipelineExecution = (nodes: AllNodes[], edges: Edge[]) => {
  const [executionState, setExecutionState] = useState<ExecutionState>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const [progressInfo, setProgressInfo] = useState<{[nodeId: string]: {completed: number, total: number}}>({});
  const { callChatGPT } = useChatGPTApi();

  // Create utility functions
  const executionManager = createExecutionManager(nodes, edges);
  const processNode = createNodeProcessor(nodes, callChatGPT);

  /**
   * Execute pipeline starting from a document input node
   */
  const executePipeline = useCallback(async (startNodeId: string) => {
    if (isExecuting) return;

    setIsExecuting(true);
    setFinalOutput(null);
    setProgressInfo({});
    
    try {
      const executionOrder = executionManager.getExecutionOrder(startNodeId);
      console.log('Legal document processing pipeline execution order:', executionOrder);

      // Initialize execution state
      const newExecutionState = executionManager.initializeExecutionState(executionOrder);
      setExecutionState(newExecutionState);

      let currentData: any = null;
      const pipelineResults: any[] = [];

      // Process each node in order
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        
        // Update status to processing
        setExecutionState(prev => ({
          ...prev,
          [nodeId]: { ...prev[nodeId], status: 'processing' }
        }));

        try {
          if (node?.data?.moduleType === 'document-input') {
            // Extract text from legal document
            currentData = await extractDocumentText(node as DocumentInputNode);
            
            // Show chunking info if document was chunked
            if (currentData.chunks && currentData.chunks.length > 1) {
              console.log(`Document chunked into ${currentData.chunks.length} parts for processing`);
            }
          } else {
            // Process with ChatGPT using legal prompts
            const onProgress = (completed: number, total: number) => {
              setProgressInfo(prev => ({
                ...prev,
                [nodeId]: { completed, total }
              }));
            };
            
            currentData = await processNode(nodeId, currentData, onProgress);
          }

          pipelineResults.push({
            nodeId,
            moduleType: node?.data?.moduleType,
            result: currentData
          });

          // Update status to completed with data
          setExecutionState(prev => ({
            ...prev,
            [nodeId]: { 
              status: 'completed', 
              data: currentData 
            }
          }));

          // Clear progress for this node
          setProgressInfo(prev => {
            const newProgress = { ...prev };
            delete newProgress[nodeId];
            return newProgress;
          });

        } catch (error: any) {
          // Update status to error
          setExecutionState(prev => ({
            ...prev,
            [nodeId]: { 
              status: 'error', 
              error: error.message 
            }
          }));
          throw error; // Stop execution on error
        }
      }

      // Create comprehensive final output for legal review
      const finalLegalOutput = executionManager.createFinalOutput(pipelineResults, currentData);
      setFinalOutput(finalLegalOutput);
      console.log('Legal document processing pipeline completed successfully');

    } catch (error: any) {
      console.error('Legal document processing pipeline failed:', error);
    } finally {
      setIsExecuting(false);
      setProgressInfo({});
    }
  }, [isExecuting, executionManager, processNode, nodes]);

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
   * Get execution status for a specific node
   */
  const getNodeExecutionStatus = useCallback((nodeId: string) => {
    const baseStatus = executionState[nodeId] || { status: 'idle' };
    const progress = progressInfo[nodeId];
    
    return {
      ...baseStatus,
      progress: progress ? `${progress.completed}/${progress.total}` : undefined
    };
  }, [executionState, progressInfo]);

  /**
   * Reset execution state
   */
  const resetExecution = useCallback(() => {
    setExecutionState({});
    setFinalOutput(null);
    setIsExecuting(false);
    setProgressInfo({});
  }, []);

  return {
    executionState,
    isExecuting,
    finalOutput,
    progressInfo,
    executeAllPipelines,
    executePipeline,
    getNodeExecutionStatus,
    resetExecution,
    getDocumentInputNodes: executionManager.getDocumentInputNodes,
    getExecutionOrder: executionManager.getExecutionOrder
  };
};
