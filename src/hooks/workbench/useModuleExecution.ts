
/**
 * useModuleExecution Hook
 * 
 * Purpose: Handles execution of individual modules
 * Manages module-specific processing logic
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useChatGPTApi } from "./useChatGPTApi";
import { useMockDataGenerator } from "./useMockDataGenerator";
import { ModuleKind } from "@/data/modules";

export const useModuleExecution = () => {
  const { callChatGPT } = useChatGPTApi();
  const { generateMockData } = useMockDataGenerator();

  /**
   * Type guard to check if a string is a valid ModuleKind
   */
  const isValidModuleKind = useCallback((type: string): type is ModuleKind => {
    const validTypes: ModuleKind[] = [
      'document-input',
      'text-extractor',
      'paragraph-splitter',
      'grammar-checker',
      'citation-finder',
      'citation-verifier',
      'style-guide-enforcer',
      'chatgpt-assistant',
      'custom'
    ];
    return validTypes.includes(type as ModuleKind);
  }, []);

  /**
   * Execute a single module
   */
  const executeModule = useCallback(async (nodeId: string, nodes: Node[], inputData: any) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const moduleType = typeof node.data?.moduleType === 'string' ? node.data.moduleType : 'default';
    const customPrompt = typeof node.data?.promptOverride === 'string' ? node.data.promptOverride : undefined;

    // Handle document input nodes
    if (moduleType === 'document-input') {
      return node.data?.extractedText || node.data?.content || 'Sample document content';
    }

    // Handle ChatGPT-enabled modules
    if (moduleType === 'chatgpt-assistant' || node.data?.supportsChatGPT) {
      try {
        const systemPrompt = customPrompt || `You are processing data through a ${moduleType} module. Process the input data accordingly.`;
        const result = await callChatGPT(
          `Process this data: ${JSON.stringify(inputData)}`,
          systemPrompt
        );
        return result.response || result.error || 'Processing completed';
      } catch (error) {
        console.error(`ChatGPT processing failed for ${nodeId}:`, error);
        return `Error processing with ChatGPT: ${error}`;
      }
    }

    // For other modules, use enhanced mock data generation
    const validModuleType = isValidModuleKind(moduleType) ? moduleType : 'text-extractor';
    return await generateMockData(validModuleType, false, true, customPrompt);
  }, [callChatGPT, generateMockData, isValidModuleKind]);

  return {
    executeModule
  };
};
