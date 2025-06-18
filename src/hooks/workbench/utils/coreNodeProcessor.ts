
/**
 * Core Node Processor
 * 
 * Purpose: Handles ChatGPT processing for individual nodes with specialized processors
 */

import { HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { parseResponseWithFallback } from "./parsing";
import { 
  createGrammarAnalysisProcessor, 
  createParagraphSplitterProcessor,
  createCitationFinderProcessor
} from "./moduleProcessors";

export const createCoreProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  // Initialize specialized processors
  const grammarProcessor = createGrammarAnalysisProcessor(callChatGPT);
  const paragraphProcessor = createParagraphSplitterProcessor(callChatGPT);
  const citationProcessor = createCitationFinderProcessor(callChatGPT);

  return async (
    node: HelperNode,
    promptData: any,
    systemPrompt: string,
    moduleType: ModuleKind
  ) => {
    console.log(`=== CORE PROCESSOR: ${moduleType} ===`);
    
    try {
      // Use specialized processors for specific modules
      if (moduleType === 'grammar-checker') {
        return await grammarProcessor(node, promptData, systemPrompt, moduleType);
      }
      
      if (moduleType === 'paragraph-splitter') {
        return await paragraphProcessor(node, promptData, systemPrompt, moduleType);
      }
      
      if (moduleType === 'citation-finder') {
        return await citationProcessor(node, promptData, systemPrompt, moduleType);
      }
      
      // Generic processing for other modules
      const cleanPromptData = typeof promptData === 'string' ? promptData : 
                             promptData?.content || 
                             JSON.stringify(promptData);
      
      console.log(`Generic processing for ${moduleType}`);
      const response = await callChatGPT(systemPrompt, cleanPromptData, 2000);
      
      if (!response || !response.trim()) {
        throw new Error(`Empty response from ChatGPT for ${moduleType}`);
      }
      
      const parsedOutput = parseResponseWithFallback(response, moduleType);
      
      return {
        success: true,
        output: parsedOutput,
        rawResponse: response,
        metadata: {
          moduleType,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error(`Error in core processor for ${moduleType}:`, error);
      
      return {
        success: false,
        output: { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          moduleType,
          error: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  };
};
