
/**
 * usePipelineExecutor Hook
 * 
 * Purpose: Core pipeline execution logic with document processing
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { useChatGPTApi } from "./useChatGPTApi";
import { extractDocumentText } from "./utils/documentProcessor";
import { createNodeProcessor } from "./utils/nodeProcessor";
import { createExecutionManager } from "./utils/executionManager";
import { usePipelineState } from "./usePipelineState";
import { usePipelineProgress } from "./usePipelineProgress";

export const usePipelineExecutor = (nodes: AllNodes[], edges: Edge[]) => {
  const { callChatGPT } = useChatGPTApi();
  const {
    executionState,
    isExecuting,
    finalOutput,
    setIsExecuting,
    setFinalOutput,
    updateNodeStatus,
    initializeState,
    resetState,
    getNodeExecutionStatus
  } = usePipelineState();

  const {
    progressInfo,
    updateProgress,
    clearProgress,
    resetAllProgress
  } = usePipelineProgress();

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
    resetAllProgress();
    
    try {
      const executionOrder = executionManager.getExecutionOrder(startNodeId);
      console.log('Legal document processing pipeline execution order:', executionOrder);

      // Initialize execution state
      initializeState(executionOrder);

      let currentData: any = null;
      const pipelineResults: any[] = [];

      // Process each node in order
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        
        // Update status to processing
        updateNodeStatus(nodeId, { status: 'processing' });

        try {
          if (node?.data?.moduleType === 'document-input') {
            // Extract text from legal document
            currentData = await extractDocumentText(node as DocumentInputNode);
            
            // Show chunking info if document was chunked
            if (currentData.chunks && currentData.chunks.length > 1) {
              console.log(`Document chunked into ${currentData.chunks.length} parts for processing`);
            }
            
            // Log document statistics
            const stats = currentData.metadata;
            console.log(`Document stats: ${stats?.contentLength || 0} chars, ${stats?.estimatedTokens || 0} tokens, ${stats?.chunkCount || 1} chunks`);
            
          } else {
            // Enhanced progress callback for module-specific tracking
            const onProgress = (progress: any) => {
              // Handle both old and new progress formats
              let completed: number, total: number;
              
              if (typeof progress === 'object' && progress.completed !== undefined) {
                // New ModuleProgress format
                completed = progress.completed;
                total = progress.total;
                
                // Log module-specific progress
                const inputType = progress.inputType || 'items';
                const outputInfo = progress.outputGenerated ? ` → ${progress.outputGenerated} ${progress.outputType || 'items'}` : '';
                console.log(`${node?.data?.moduleType}: Processing ${inputType} ${completed}/${total}${outputInfo}`);
              } else {
                // Legacy format compatibility
                completed = progress.completed || progress;
                total = progress.total || 1;
              }
              
              updateProgress(nodeId, completed, total);
              
              // Update execution state with enhanced progress
              updateNodeStatus(nodeId, { 
                status: 'processing',
                progress: `${completed}/${total}` 
              });
            };
            
            // Log input data statistics before processing
            if (currentData) {
              if (currentData.paragraphs && Array.isArray(currentData.paragraphs)) {
                console.log(`${node?.data?.moduleType}: Processing ${currentData.paragraphs.length} paragraphs`);
              } else if (currentData.chunks && Array.isArray(currentData.chunks)) {
                console.log(`${node?.data?.moduleType}: Processing ${currentData.chunks.length} chunks`);
              } else if (currentData.content) {
                console.log(`${node?.data?.moduleType}: Processing content (${currentData.content.length} chars)`);
              }
            }
            
            currentData = await processNode(nodeId, currentData, onProgress);
            
            // Log output data statistics after processing
            if (currentData && currentData.output) {
              const output = currentData.output;
              if (output.paragraphs && Array.isArray(output.paragraphs)) {
                console.log(`${node?.data?.moduleType}: Generated ${output.paragraphs.length} paragraphs`);
              } else if (output.analysis && Array.isArray(output.analysis)) {
                console.log(`${node?.data?.moduleType}: Analyzed ${output.analysis.length} items`);
              } else if (output.totalParagraphs) {
                console.log(`${node?.data?.moduleType}: Processed ${output.totalParagraphs} paragraphs`);
              }
            }
          }

          pipelineResults.push({
            nodeId,
            moduleType: node?.data?.moduleType,
            result: currentData
          });

          // Update status to completed with data and statistics
          updateNodeStatus(nodeId, { 
            status: 'completed', 
            data: currentData,
            processingTime: currentData?.metadata?.processingTime
          });

          // Clear progress for this node
          clearProgress(nodeId);

        } catch (error: any) {
          console.error(`Error processing node ${nodeId} (${node?.data?.moduleType}):`, error);
          
          // Update status to error
          updateNodeStatus(nodeId, { 
            status: 'error', 
            error: error.message 
          });
          throw error; // Stop execution on error
        }
      }

      // Create comprehensive final output for legal review
      const finalLegalOutput = executionManager.createFinalOutput(pipelineResults, currentData);
      setFinalOutput(finalLegalOutput);
      
      // Log final pipeline statistics
      console.log('Legal document processing pipeline completed successfully');
      console.log(`Final output contains:`, {
        totalModules: pipelineResults.length,
        finalDataType: typeof currentData,
        hasAnalysis: currentData?.output?.analysis ? currentData.output.analysis.length : 0,
        hasParagraphs: currentData?.output?.paragraphs ? currentData.output.paragraphs.length : 0
      });

    } catch (error: any) {
      console.error('Legal document processing pipeline failed:', error);
    } finally {
      setIsExecuting(false);
      resetAllProgress();
    }
  }, [
    isExecuting, 
    executionManager, 
    processNode, 
    nodes, 
    setIsExecuting, 
    setFinalOutput, 
    resetAllProgress, 
    initializeState, 
    updateNodeStatus, 
    updateProgress, 
    clearProgress
  ]);

  return {
    executePipeline,
    executionState,
    isExecuting,
    finalOutput,
    progressInfo,
    getNodeExecutionStatus,
    resetState: () => {
      resetState();
      resetAllProgress();
    }
  };
};
