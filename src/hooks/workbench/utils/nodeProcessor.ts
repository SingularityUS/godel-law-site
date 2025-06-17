/**
 * Node Processor Utility
 * 
 * Purpose: Handles processing of individual nodes with ChatGPT
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";

export const createNodeProcessor = (nodes: AllNodes[], callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (nodeId: string, inputData: any): Promise<any> => {
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
    
    // Format input data for legal processing
    let promptData: string;
    if (typeof inputData === 'object') {
      promptData = JSON.stringify(inputData, null, 2);
    } else {
      promptData = String(inputData);
    }

    console.log(`Processing legal module ${nodeId} (${moduleType}) with ChatGPT`);
    
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
        // Keep as text if JSON parsing fails
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
  };
};
