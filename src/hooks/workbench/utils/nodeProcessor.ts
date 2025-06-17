
/**
 * Node Processor Utility
 * 
 * Purpose: Handles processing of individual nodes with ChatGPT, simplified with extracted parsers
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { processWithBatching, shouldUseBatchProcessing, shouldProcessParagraphsIndividually } from "./batchProcessor";
import { DocumentChunk } from "./documentChunker";
import { parseJsonResponse, parseGrammarResponse } from "./parsing";

// Enhanced progress interface for module-specific tracking
export interface ModuleProgress {
  completed: number;
  total: number;
  moduleType: ModuleKind;
  inputType: 'chunks' | 'paragraphs' | 'documents';
  outputGenerated?: number;
  outputType?: string;
}

export const createNodeProcessor = (nodes: AllNodes[], callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (nodeId: string, inputData: any, onProgress?: (progress: ModuleProgress) => void): Promise<any> => {
    const startTime = Date.now();
    const node = nodes.find(n => n.id === nodeId) as HelperNode;
    
    if (!node || node.data?.moduleType === 'document-input') {
      return inputData; // Skip document input nodes
    }

    const moduleType = node.data.moduleType as ModuleKind;
    const moduleDef = MODULE_DEFINITIONS.find(m => m.type === moduleType);
    
    // Text extractor is now a pass-through module (for future deprecation)
    if (moduleType === 'text-extractor') {
      console.log(`Text extractor ${nodeId} operating as pass-through (deprecated behavior)`);
      const processingTime = Date.now() - startTime;
      
      return {
        ...inputData,
        metadata: {
          ...inputData.metadata,
          processingTime,
          passedThrough: true,
          moduleType: 'text-extractor',
          timestamp: new Date().toISOString(),
          note: 'Text extraction handled by document processor - this module is now pass-through'
        }
      };
    }
    
    if (!moduleDef?.supportsChatGPT) {
      console.warn(`Module ${moduleType} does not support ChatGPT processing`);
      return inputData; // Pass through unchanged
    }

    // Use custom prompt if available, otherwise use default legal prompt
    const systemPrompt = node.data.promptOverride || moduleDef.defaultPrompt;
    
    console.log(`Processing legal module ${nodeId} (${moduleType}) with ChatGPT`);
    
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
        
        const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Use appropriate parser based on module type
        let processedOutput: any;
        if (moduleType === 'grammar-checker') {
          processedOutput = parseGrammarResponse(result.response);
        } else {
          processedOutput = parseJsonResponse(result.response, moduleType);
        }
        
        return {
          moduleType,
          output: processedOutput,
          metadata: {
            model: result.model,
            timestamp: new Date().toISOString(),
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
      
      const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Use appropriate parser based on module type
      let processedOutput: any;
      if (moduleType === 'grammar-checker') {
        processedOutput = parseGrammarResponse(result.response);
      } else {
        processedOutput = parseJsonResponse(result.response, moduleType);
      }

      // Report completion
      if (onProgress) {
        const progress: ModuleProgress = {
          completed: 1,
          total: 1,
          moduleType,
          inputType: 'documents',
          outputGenerated: Array.isArray(processedOutput.paragraphs) ? processedOutput.paragraphs.length : 
                          Array.isArray(processedOutput.analysis) ? processedOutput.analysis.length : 1
        };
        onProgress(progress);
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
