
/**
 * Node Processor Utility
 * 
 * Purpose: Handles processing of individual nodes with ChatGPT, refactored with extracted components
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { ModuleProgress } from "./moduleProgress";
import { createModuleProcessor } from "./moduleProcessor";
import { handleTextExtractor } from "./textExtractorHandler";

export const createNodeProcessor = (nodes: AllNodes[], callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  const moduleProcessor = createModuleProcessor(callChatGPT);

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
      return handleTextExtractor(nodeId, inputData, startTime);
    }
    
    if (!moduleDef?.supportsChatGPT) {
      console.warn(`Module ${moduleType} does not support ChatGPT processing`);
      return inputData; // Pass through unchanged
    }

    // Use custom prompt if available, otherwise use default legal prompt
    const systemPrompt = node.data.promptOverride || moduleDef.defaultPrompt;
    
    console.log(`Processing legal module ${nodeId} (${moduleType}) with ChatGPT`);
    
    return await moduleProcessor(node, inputData, moduleType, moduleDef, systemPrompt, onProgress);
  };
};

// Re-export the ModuleProgress type for backward compatibility
export type { ModuleProgress } from "./moduleProgress";
