
/**
 * usePipelineExecutor Hook
 * 
 * Purpose: Core pipeline execution logic with document processing
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { createExecutionManager } from "./utils/executionManager";
import { usePipelineState } from "./usePipelineState";
import { usePipelineProgress } from "./usePipelineProgress";
import { usePipelineDocumentProcessor } from "./usePipelineDocumentProcessor";
import { usePipelineModuleProcessor } from "./usePipelineModuleProcessor";

export const usePipelineExecutor = (nodes: AllNodes[], edges: Edge[]) => {
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

  const { processDocumentNode } = usePipelineDocumentProcessor();
  const { processModuleNode } = usePipelineModuleProcessor(nodes);

  // Create utility functions
  const executionManager = createExecutionManager(nodes, edges);

  /**
   * Execute pipeline starting from a document input node with enhanced document context flow
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
      let documentExtractionResult: any = null; // Store initial document result
      const pipelineResults: any[] = [];

      // Process each node in order
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        
        // Update status to processing
        updateNodeStatus(nodeId, { status: 'processing' });

        try {
          if (node?.data?.moduleType === 'document-input') {
            currentData = await processDocumentNode(node as DocumentInputNode);
            documentExtractionResult = currentData; // Preserve the initial document extraction
            console.log('Document extraction result preserved for streaming:', {
              hasOriginalContent: !!documentExtractionResult?.originalContent,
              hasProcessableContent: !!documentExtractionResult?.processableContent,
              fileName: documentExtractionResult?.fileName,
              contentLength: documentExtractionResult?.originalContent?.length || 0
            });
          } else {
            // ENHANCED: Pass document extraction result to module processing
            currentData = await processModuleNode(
              nodeId, 
              currentData, 
              updateProgress, 
              updateNodeStatus, 
              clearProgress,
              documentExtractionResult // PASS: Document extraction result for streaming context
            );
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

      // Create comprehensive final output for legal review with preserved document extraction
      const finalLegalOutput = executionManager.createFinalOutput(pipelineResults, currentData, documentExtractionResult);
      setFinalOutput(finalLegalOutput);
      
      // Log final pipeline statistics
      console.log('Legal document processing pipeline completed successfully with document context preserved');
      console.log(`Final output contains:`, {
        totalModules: pipelineResults.length,
        finalDataType: typeof currentData,
        hasAnalysis: currentData?.output?.analysis ? currentData.output.analysis.length : 0,
        hasParagraphs: currentData?.output?.paragraphs ? currentData.output.paragraphs.length : 0,
        hasDocumentExtraction: !!documentExtractionResult,
        documentExtractionOriginalContent: documentExtractionResult?.originalContent?.length || 0
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
    processDocumentNode,
    processModuleNode,
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
