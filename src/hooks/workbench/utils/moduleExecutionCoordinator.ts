
/**
 * Module Execution Coordinator
 * 
 * Purpose: Coordinates execution flow for different module types
 */

import { HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { processWithBatching, shouldUseBatchProcessing, shouldProcessParagraphsIndividually } from "./batchProcessor";
import { DocumentChunk } from "./documentChunker";
import { ModuleProgress } from "./moduleProgress";
import { createCoreProcessor } from "./coreNodeProcessor";
import { prepareModuleInput, extractCleanContent } from "./inputPreparation";

export const createModuleExecutionCoordinator = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
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
    
    console.log(`=== MODULE EXECUTION COORDINATOR: ${moduleType} ===`);
    console.log('Input data structure:', typeof inputData, inputData ? Object.keys(inputData) : 'null');
    
    // Log if we have position tracking data
    if (inputData && inputData.positionMap) {
      console.log('Position tracking available:', {
        characterMappings: inputData.positionMap.characterMap?.length || 0,
        paragraphBoundaries: inputData.positionMap.paragraphBoundaries?.length || 0
      });
    }
    
    // Prepare clean input data for the module
    const cleanInputData = prepareModuleInput(inputData, moduleType);
    console.log('Prepared input type:', typeof cleanInputData);

    // Check if we need batch processing
    if (shouldUseBatchProcessing(cleanInputData) || shouldProcessParagraphsIndividually(cleanInputData, moduleType)) {
      return await handleBatchProcessing(
        node, cleanInputData, moduleType, systemPrompt, 
        coreProcessor, onProgress, startTime, inputData
      );
    } else {
      return await handleSingleDocumentProcessing(
        node, cleanInputData, moduleType, systemPrompt, 
        coreProcessor, onProgress, startTime, inputData
      );
    }
  };
};

async function handleBatchProcessing(
  node: HelperNode,
  cleanInputData: any,
  moduleType: ModuleKind,
  systemPrompt: string,
  coreProcessor: any,
  onProgress?: (progress: ModuleProgress) => void,
  startTime?: number,
  originalInputData?: any
) {
  console.log(`Using batch processing for module ${moduleType} with position preservation`);
  
  // Define processing function for individual chunks with position awareness
  const processChunk = async (chunkContent: string, chunkInfo?: DocumentChunk) => {
    const cleanChunkContent = extractCleanContent(chunkContent, moduleType);
    
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
        } : undefined,
        preservesPositions: true
      }
    };
  };
  
  // Enhanced progress callback
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
      
      if (moduleType === 'paragraph-splitter') {
        progress.outputType = 'paragraphs';
      } else if (moduleType === 'grammar-checker') {
        progress.outputType = 'errors';
      }
      
      onProgress(progress);
    }
  };
  
  const result = await processWithBatching(cleanInputData, processChunk, moduleProgressCallback, moduleType);
  
  const processingTime = Date.now() - (startTime || 0);
  
  return {
    ...result,
    metadata: {
      ...result.metadata,
      processingTime,
      batchProcessed: true,
      totalProcessingTime: processingTime,
      preservesPositions: true,
      originalPositionMap: originalInputData?.positionMap
    }
  };
}

async function handleSingleDocumentProcessing(
  node: HelperNode,
  cleanInputData: any,
  moduleType: ModuleKind,
  systemPrompt: string,
  coreProcessor: any,
  onProgress?: (progress: ModuleProgress) => void,
  startTime?: number,
  originalInputData?: any
) {
  console.log(`Processing single document for ${moduleType} with position tracking`);
  
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

  const processingTime = Date.now() - (startTime || 0);
  
  return {
    ...result,
    metadata: {
      ...result.metadata,
      processingTime,
      timestamp: new Date().toISOString(),
      preservesPositions: true,
      originalPositionMap: originalInputData?.positionMap
    }
  };
}
