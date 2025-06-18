
/**
 * usePipelineModuleProcessor Hook
 * 
 * Purpose: Handles module processing within pipeline execution
 */

import { useCallback } from "react";
import { AllNodes } from "@/types/workbench";
import { useChatGPTApi } from "./useChatGPTApi";
import { createNodeProcessor } from "./utils/nodeProcessor";

export const usePipelineModuleProcessor = (nodes: AllNodes[]) => {
  const { callChatGPT } = useChatGPTApi();
  const processNode = createNodeProcessor(nodes, callChatGPT);

  const processModuleNode = useCallback(async (
    nodeId: string, 
    currentData: any, 
    updateProgress: (nodeId: string, completed: number, total: number) => void,
    updateNodeStatus: (nodeId: string, status: any) => void,
    clearProgress: (nodeId: string) => void
  ) => {
    const node = nodes.find(n => n.id === nodeId);
    
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
    
    const result = await processNode(nodeId, currentData, onProgress);
    
    // Log output data statistics after processing
    if (result && result.output) {
      const output = result.output;
      if (output.paragraphs && Array.isArray(output.paragraphs)) {
        console.log(`${node?.data?.moduleType}: Generated ${output.paragraphs.length} paragraphs`);
      } else if (output.analysis && Array.isArray(output.analysis)) {
        console.log(`${node?.data?.moduleType}: Analyzed ${output.analysis.length} items`);
      } else if (output.totalParagraphs) {
        console.log(`${node?.data?.moduleType}: Processed ${output.totalParagraphs} paragraphs`);
      }
    }

    // Clear progress for this node
    clearProgress(nodeId);
    
    return result;
  }, [nodes, processNode]);

  return {
    processModuleNode
  };
};
