
/**
 * Node Processor Utility
 * 
 * Purpose: Handles processing of individual nodes with ChatGPT, including batch processing for large documents
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { processWithBatching, shouldUseBatchProcessing } from "./batchProcessor";
import { DocumentChunk } from "./documentChunker";

export const createNodeProcessor = (nodes: AllNodes[], callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (nodeId: string, inputData: any, onProgress?: (completed: number, total: number) => void): Promise<any> => {
    const startTime = Date.now();
    const node = nodes.find(n => n.id === nodeId) as HelperNode;
    
    if (!node || node.data?.moduleType === 'document-input') {
      return inputData; // Skip document input nodes
    }

    const moduleType = node.data.moduleType as ModuleKind;
    const moduleDef = MODULE_DEFINITIONS.find(m => m.type === moduleType);
    
    if (!moduleDef?.supportsChatGPT) {
      console.warn(`Module ${moduleType} does not support ChatGPT processing`);
      return inputData; // Pass through unchanged
    }

    // Use custom prompt if available, otherwise use default legal prompt
    const systemPrompt = node.data.promptOverride || moduleDef.defaultPrompt;
    
    console.log(`Processing legal module ${nodeId} (${moduleType}) with ChatGPT`);
    
    // Check if we need batch processing
    if (shouldUseBatchProcessing(inputData)) {
      console.log(`Using batch processing for module ${moduleType}`);
      
      // Define processing function for individual chunks
      const processChunk = async (chunkContent: string, chunkInfo?: DocumentChunk) => {
        // Format chunk data for legal processing
        let promptData: string;
        if (typeof chunkContent === 'object') {
          promptData = JSON.stringify(chunkContent, null, 2);
        } else {
          promptData = String(chunkContent);
        }
        
        // Add chunk context to prompt if available
        if (chunkInfo) {
          promptData = `[Chunk ${chunkInfo.chunkIndex + 1} of ${chunkInfo.totalChunks}]\n\n${promptData}`;
        }
        
        const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Try to parse JSON response for structured modules
        let processedOutput = result.response;
        if (moduleDef.outputFormat === 'json') {
          try {
            processedOutput = JSON.parse(result.response);
          } catch (parseError) {
            console.warn(`Failed to parse JSON from ${moduleType} chunk, using text response`);
          }
        }
        
        return {
          moduleType,
          output: processedOutput,
          metadata: {
            model: result.model,
            timestamp: new Date().toISOString(),
            chunkProcessed: true
          }
        };
      };
      
      // Process with batching
      const result = await processWithBatching(inputData, processChunk, onProgress);
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTime,
          batchProcessed: true,
          totalProcessingTime: processingTime
        }
      };
      
    } else {
      // Single document processing
      let promptData: string;
      if (typeof inputData === 'object') {
        promptData = JSON.stringify(inputData, null, 2);
      } else {
        promptData = String(inputData);
      }
      
      const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Try to parse JSON response for structured modules
      let processedOutput = result.response;
      if (moduleDef.outputFormat === 'json') {
        try {
          processedOutput = JSON.parse(result.response);
        } catch (parseError) {
          console.warn(`Failed to parse JSON from ${moduleType}, using text response`);
        }
      }

      const processingTime = Date.now() - startTime;
      
      return {
        moduleType,
        output: processedOutput,
        metadata: {
          processingTime,
          model: result.model,
          timestamp: new Date().toISOString()
        }
      };
    }
  };
};
