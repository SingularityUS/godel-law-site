
/**
 * Core Node Processor
 * 
 * Purpose: Core processing logic for individual nodes
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { parseJsonResponse, parseGrammarResponse } from "./parsing";

export const createCoreProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (
    node: HelperNode,
    promptData: string,
    systemPrompt: string,
    moduleType: ModuleKind
  ) => {
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
        timestamp: new Date().toISOString()
      }
    };
  };
};
