
/**
 * usePipelineExecution Hook
 * 
 * Purpose: Orchestrates sequential execution of AI modules in the workbench
 * Enhanced for complete document processing with debug tracking
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { useChatGPTApi } from "./useChatGPTApi";
import { ExecutionState } from "./types/pipelineTypes";
import { extractDocumentText } from "./utils/documentProcessor";
import { createNodeProcessor } from "./utils/nodeProcessor";
import { createExecutionManager } from "./utils/executionManager";
import { MODULE_DEFINITIONS } from "@/data/modules";

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
   * Enhanced progress tracking with debug information
   */
  const updateNodeDebugInfo = useCallback((nodeId: string, debugInfo: any) => {
    setExecutionState(prev => ({
      ...prev,
      [nodeId]: { 
        ...prev[nodeId], 
        debugInfo 
      }
    }));
  }, []);

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

      // Initialize execution state with debug information
      const newExecutionState = executionManager.initializeExecutionState(executionOrder);
      
      // Add initial debug info for each node
      executionOrder.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        const moduleDef = MODULE_DEFINITIONS.find(m => m.type === node?.data?.moduleType);
        
        newExecutionState[nodeId] = {
          ...newExecutionState[nodeId],
          debugInfo: {
            isPassThrough: moduleDef?.isPassThrough,
            isDeprecated: moduleDef?.isDeprecated,
            totalItems: 0,
            processedItems: 0,
            itemType: getItemTypeForModule(node?.data?.moduleType)
          }
        };
      });
      
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
            
            // Update debug info for document processing
            updateNodeDebugInfo(nodeId, {
              totalItems: 1,
              processedItems: 1,
              itemType: 'document',
              contentLength: currentData?.content?.length || 0,
              hasChunks: currentData?.chunks?.length > 0,
              chunkCount: currentData?.chunks?.length || 0
            });
            
            // Show chunking info if document was chunked
            if (currentData.chunks && currentData.chunks.length > 1) {
              console.log(`Document chunked into ${currentData.chunks.length} parts for processing`);
            }
          } else {
            // Enhanced progress tracking for ChatGPT modules
            const onProgress = (completed: number, total: number) => {
              setProgressInfo(prev => ({
                ...prev,
                [nodeId]: { completed, total }
              }));
              
              // Update debug info with progress
              updateNodeDebugInfo(nodeId, {
                totalItems: total,
                processedItems: completed,
                itemType: getItemTypeForModule(node?.data?.moduleType),
                progress: `${completed}/${total}`
              });
            };
            
            // Predict total items for better progress tracking
            const predictedTotal = predictTotalItems(node?.data?.moduleType, currentData);
            if (predictedTotal > 0) {
              updateNodeDebugInfo(nodeId, {
                totalItems: predictedTotal,
                processedItems: 0,
                itemType: getItemTypeForModule(node?.data?.moduleType)
              });
            }
            
            currentData = await processNode(nodeId, currentData, onProgress);
            
            // Update final debug info after processing
            const finalDebugInfo = extractDebugInfoFromResult(currentData, node?.data?.moduleType);
            updateNodeDebugInfo(nodeId, finalDebugInfo);
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
  }, [isExecuting, executionManager, processNode, nodes, updateNodeDebugInfo]);

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
   * Get execution status for a specific node with enhanced debug info
   */
  const getNodeExecutionStatus = useCallback((nodeId: string) => {
    const baseStatus = executionState[nodeId] || { status: 'idle' };
    const progress = progressInfo[nodeId];
    
    return {
      ...baseStatus,
      progress: progress ? `${progress.completed}/${progress.total}` : undefined,
      debugInfo: baseStatus.debugInfo
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

/**
 * Helper function to get item type for different modules
 */
function getItemTypeForModule(moduleType: any): string {
  switch (moduleType) {
    case 'document-input': return 'document';
    case 'text-extractor': return 'text';
    case 'paragraph-splitter': return 'paragraphs';
    case 'grammar-checker': return 'paragraphs';
    case 'citation-finder': return 'citations';
    case 'citation-verifier': return 'citations';
    case 'style-guide-enforcer': return 'sections';
    default: return 'items';
  }
}

/**
 * Helper function to predict total items for progress tracking
 */
function predictTotalItems(moduleType: any, inputData: any): number {
  if (!inputData) return 0;
  
  switch (moduleType) {
    case 'paragraph-splitter':
      // Estimate paragraphs based on content length
      if (inputData.content) {
        return Math.max(1, Math.ceil(inputData.content.length / 500)); // Rough estimate
      }
      return 1;
    case 'grammar-checker':
      // Use actual paragraph count if available
      if (inputData.output?.totalParagraphs) {
        return inputData.output.totalParagraphs;
      }
      if (inputData.output?.paragraphs?.length) {
        return inputData.output.paragraphs.length;
      }
      return 1;
    default:
      return 1;
  }
}

/**
 * Helper function to extract debug info from processing results
 */
function extractDebugInfoFromResult(result: any, moduleType: any): any {
  const debugInfo: any = {
    itemType: getItemTypeForModule(moduleType)
  };
  
  if (result?.metadata) {
    debugInfo.processingTime = result.metadata.processingTime;
    debugInfo.model = result.metadata.model;
    
    if (result.metadata.totalParagraphs) {
      debugInfo.totalItems = result.metadata.totalParagraphs;
      debugInfo.processedItems = result.metadata.totalParagraphs;
    }
    
    if (result.metadata.paragraphsAnalyzed) {
      debugInfo.totalItems = result.metadata.totalParagraphs || result.metadata.paragraphsAnalyzed;
      debugInfo.processedItems = result.metadata.paragraphsAnalyzed;
    }
    
    if (result.metadata.batchesProcessed) {
      debugInfo.batchesProcessed = result.metadata.batchesProcessed;
    }
  }
  
  if (result?.output) {
    if (result.output.totalParagraphs) {
      debugInfo.totalItems = result.output.totalParagraphs;
      debugInfo.processedItems = result.output.totalParagraphs;
    }
    
    if (result.output.paragraphs?.length) {
      debugInfo.totalItems = result.output.paragraphs.length;
      debugInfo.processedItems = result.output.paragraphs.length;
    }
    
    if (result.output.analysis?.length) {
      debugInfo.totalItems = result.output.analysis.length;
      debugInfo.processedItems = result.output.analysis.length;
    }
  }
  
  return debugInfo;
}
