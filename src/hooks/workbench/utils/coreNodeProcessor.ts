
/**
 * Core Node Processor
 * 
 * Purpose: Handles ChatGPT processing for individual nodes with specialized processors
 */

import { HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { 
  createCitationFinderProcessor
} from "./moduleProcessors";

export const createCoreProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  // Initialize specialized processors
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
      if (moduleType === 'citation-finder') {
        return await citationProcessor(node, promptData, systemPrompt, moduleType);
      }
      
      // Generic processing for other modules
      const cleanPromptData = typeof promptData === 'string' ? promptData : 
                             promptData?.content || 
                             JSON.stringify(promptData);
      
      console.log(`Generic processing for ${moduleType}`);
      const data = await callChatGPT(systemPrompt, cleanPromptData, "gpt-4o-mini", 2000);
      
      // Handle API error responses
      if (data?.error) {
        console.error('ChatGPT API error:', data.error);
        throw new Error(`ChatGPT API error: ${data.error}`);
      }
      
      // Extract the actual response text
      const response = data?.response || data;
      
      if (!response || (typeof response === 'string' && !response.trim())) {
        throw new Error(`Empty response from ChatGPT for ${moduleType}`);
      }
      
      // Simple JSON parsing with fallback
      let parsedOutput;
      try {
        const responseText = typeof response === 'string' ? response : JSON.stringify(response);
        parsedOutput = JSON.parse(responseText);
      } catch (parseError) {
        console.warn(`Failed to parse JSON response for ${moduleType}, using raw response`);
        parsedOutput = { content: response };
      }
      
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
