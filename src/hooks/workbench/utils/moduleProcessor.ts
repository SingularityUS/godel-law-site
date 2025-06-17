
/**
 * Module Processor
 * 
 * Purpose: Handles different types of module processing with enhanced data cleaning
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
    
    console.log(`=== MODULE PROCESSOR: ${moduleType} ===`);
    console.log('Input data structure:', typeof inputData, inputData ? Object.keys(inputData) : 'null');
    
    // Prepare clean input data for the module
    const cleanInputData = prepareModuleInput(inputData, moduleType);
    console.log('Prepared input type:', typeof cleanInputData);

    // Check if we need batch processing or individual paragraph processing
    if (shouldUseBatchProcessing(cleanInputData) || shouldProcessParagraphsIndividually(cleanInputData, moduleType)) {
      console.log(`Using batch processing for module ${moduleType}`);
      
      // Define processing function for individual chunks with module-specific progress
      const processChunk = async (chunkContent: string, chunkInfo?: DocumentChunk) => {
        // Ensure chunk content is clean text
        const cleanChunkContent = extractCleanContent(chunkContent, moduleType);
        
        // Add chunk context to prompt if available
        let promptData = cleanChunkContent;
        if (chunkInfo) {
          promptData = `[Chunk ${chunkInfo.chunkIndex + 1} of ${chunkInfo.totalChunks}]\n\n${cleanChunkContent}`;
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
          const inputType = shouldProcessParagraphsIndividually(cleanInputData, moduleType) ? 'paragraphs' : 
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
      
      // Process with batching
      const result = await processWithBatching(cleanInputData, processChunk, moduleProgressCallback, moduleType);
      
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
      console.log(`Processing single document for ${moduleType}`);
      
      // Extract clean content for processing
      const cleanContent = extractCleanContent(cleanInputData, moduleType);
      
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
      
      const result = await coreProcessor(node, cleanContent, systemPrompt, moduleType);

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

/**
 * Prepare input data for module processing
 */
function prepareModuleInput(inputData: any, moduleType: ModuleKind): any {
  if (!inputData) return inputData;
  
  // For paragraph splitter, ensure we have clean text content
  if (moduleType === 'paragraph-splitter') {
    // If inputData has clean content, extract it
    if (inputData.content && typeof inputData.content === 'string') {
      return { content: inputData.content };
    }
    
    // If it's already in the expected format, return as-is
    if (typeof inputData === 'string') {
      return { content: inputData };
    }
  }
  
  return inputData;
}

/**
 * Extract clean content based on module type
 */
function extractCleanContent(inputData: any, moduleType: ModuleKind): string {
  if (typeof inputData === 'string') {
    return inputData;
  }
  
  if (typeof inputData === 'object' && inputData !== null) {
    // For paragraph splitter, prioritize clean text content
    if (moduleType === 'paragraph-splitter') {
      if (inputData.content && typeof inputData.content === 'string') {
        return inputData.content;
      }
    }
    
    // For other modules, return JSON representation
    return JSON.stringify(inputData, null, 2);
  }
  
  return String(inputData);
}
