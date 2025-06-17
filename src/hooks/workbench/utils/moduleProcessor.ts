
/**
 * Module Processor
 * 
 * Purpose: Handles different types of module processing (single, batch, paragraph)
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { processWithBatching, shouldUseBatchProcessing, shouldProcessParagraphsIndividually } from "./batchProcessor";
import { DocumentChunk } from "./documentChunker";
import { ModuleProgress } from "./moduleProgress";
import { createCoreProcessor } from "./coreNodeProcessor";

export const createModuleProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  const coreProcessor = createCoreProcessor(callChatGPT);

  return async (
    node: HelperNode,
    inputData: any,
    moduleType: ModuleKind,
    moduleDef: any,
    systemPrompt: string,
    onProgress?: (progress: ModuleProgress) => void
  ) => {
    const startTime = Date.now();

    // Check if we need batch processing or individual paragraph processing
    if (shouldUseBatchProcessing(inputData) || shouldProcessParagraphsIndividually(inputData, moduleType)) {
      console.log(`Using batch processing for module ${moduleType}`);
      
      // Define processing function for individual chunks with module-specific progress
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
          console.log(`Processing chunk ${chunkInfo.chunkIndex + 1}/${chunkInfo.totalChunks} for ${moduleType}`);
        }
        
        const result = await coreProcessor(node, promptData, systemPrompt, moduleType);
        
        return {
          ...result,
          metadata: {
            ...result.metadata,
            chunkProcessed: true,
            chunkInfo: chunkInfo ? {
              index: chunkInfo.chunkIndex,
              total: chunkInfo.totalChunks
            } : undefined
          }
        };
      };
      
      // Enhanced progress callback with module-specific information
      const moduleProgressCallback = (completed: number, total: number, outputCount?: number) => {
        if (onProgress) {
          const inputType = shouldProcessParagraphsIndividually(inputData, moduleType) ? 'paragraphs' : 
                           moduleType === 'paragraph-splitter' ? 'chunks' : 'paragraphs';
          const progress: ModuleProgress = {
            completed,
            total,
            moduleType,
            inputType,
            outputGenerated: outputCount
          };
          
          // Add output type information
          if (moduleType === 'paragraph-splitter') {
            progress.outputType = 'paragraphs';
          } else if (moduleType === 'grammar-checker') {
            progress.outputType = 'errors';
          }
          
          onProgress(progress);
        }
      };
      
      // Process with batching (includes individual paragraph processing for grammar checker)
      const result = await processWithBatching(inputData, processChunk, moduleProgressCallback, moduleType);
      
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
      // Single document processing with progress tracking
      let promptData: string;
      if (typeof inputData === 'object') {
        promptData = JSON.stringify(inputData, null, 2);
      } else {
        promptData = String(inputData);
      }
      
      console.log(`Processing single document for ${moduleType}`);
      
      // Report progress for single document processing
      if (onProgress) {
        const progress: ModuleProgress = {
          completed: 0,
          total: 1,
          moduleType,
          inputType: 'documents'
        };
        onProgress(progress);
      }
      
      const result = await coreProcessor(node, promptData, systemPrompt, moduleType);

      // Report completion
      if (onProgress) {
        const progress: ModuleProgress = {
          completed: 1,
          total: 1,
          moduleType,
          inputType: 'documents',
          outputGenerated: Array.isArray(result.output.paragraphs) ? result.output.paragraphs.length : 
                          Array.isArray(result.output.analysis) ? result.output.analysis.length : 1
        };
        onProgress(progress);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  };
};
