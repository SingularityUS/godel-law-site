
/**
 * usePipelineExecutor Hook
 * 
 * Purpose: Core pipeline execution logic with enhanced data preservation and endpoint detection
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { createExecutionManager } from "./utils/executionManager";
import { createEndpointDetector } from "./utils/endpointDetector";
import { PipelineChangeDetector } from "./utils/pipelineChangeDetector";
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
  const endpointDetector = createEndpointDetector(nodes, edges);

  /**
   * Execute pipeline starting from a document input node with enhanced data preservation
   */
  const executePipeline = useCallback(async (startNodeId: string) => {
    if (isExecuting) return;

    setIsExecuting(true);
    setFinalOutput(null);
    resetAllProgress();
    
    try {
      const executionOrder = executionManager.getExecutionOrder(startNodeId);
      console.log('Enhanced pipeline execution order:', executionOrder);

      // Detect pipeline endpoints for redline generation
      const endpoints = endpointDetector.getPipelineEndpoints();
      console.log('Pipeline endpoints detected:', endpoints);

      // Check if pipeline has changed
      const pipelineChanged = PipelineChangeDetector.hasPipelineChanged(nodes, edges);
      console.log('Pipeline changed since last execution:', pipelineChanged);

      // Initialize execution state
      initializeState(executionOrder);

      let currentData: any = null;
      const pipelineResults: any[] = [];
      const allModuleData = new Map<string, any>(); // Preserve all module outputs

      // Process each node in order
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        
        // Update status to processing
        updateNodeStatus(nodeId, { status: 'processing' });

        try {
          if (node?.data?.moduleType === 'document-input') {
            currentData = await processDocumentNode(node as DocumentInputNode);
          } else {
            currentData = await processModuleNode(
              nodeId, 
              currentData, 
              updateProgress, 
              updateNodeStatus, 
              clearProgress
            );
          }

          // Store this module's data separately (don't overwrite)
          allModuleData.set(nodeId, {
            nodeId,
            moduleType: node?.data?.moduleType,
            result: currentData,
            isEndpoint: endpointDetector.isEndpointNode(nodeId)
          });

          pipelineResults.push({
            nodeId,
            moduleType: node?.data?.moduleType,
            result: currentData,
            isEndpoint: endpointDetector.isEndpointNode(nodeId)
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

      // Create enhanced final output with endpoint data preserved
      const enhancedFinalOutput = executionManager.createEnhancedFinalOutput(
        pipelineResults, 
        currentData, 
        endpoints,
        allModuleData
      );
      
      setFinalOutput(enhancedFinalOutput);
      
      // Log comprehensive pipeline statistics
      console.log('Enhanced pipeline execution completed successfully');
      console.log(`Final output contains:`, {
        totalModules: pipelineResults.length,
        endpointModules: endpoints.length,
        endpointTypes: endpoints.map(e => e.moduleType),
        pipelineChanged,
        preservedModuleCount: allModuleData.size
      });

    } catch (error: any) {
      console.error('Enhanced pipeline execution failed:', error);
    } finally {
      setIsExecuting(false);
      resetAllProgress();
    }
  }, [
    isExecuting, 
    executionManager, 
    endpointDetector,
    processDocumentNode,
    processModuleNode,
    nodes, 
    edges,
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
      PipelineChangeDetector.resetSignature();
    }
  };
};
