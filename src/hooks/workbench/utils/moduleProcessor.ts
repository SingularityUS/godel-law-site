
/**
 * Module Processor
 * 
 * Purpose: Simplified module processing orchestrator using extracted utilities
 */

import { HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { ModuleProgress } from "./moduleProgress";
import { createModuleExecutionCoordinator } from "./moduleExecutionCoordinator";

export const createModuleProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  const moduleExecutionCoordinator = createModuleExecutionCoordinator(callChatGPT);

  return async (
    node: HelperNode,
    inputData: any,
    moduleType: ModuleKind,
    moduleDef: any,
    systemPrompt: string,
    onProgress?: (progress: ModuleProgress) => void
  ) => {
    console.log(`=== MODULE PROCESSOR: ${moduleType} (Streamlined) ===`);
    
    return await moduleExecutionCoordinator(
      node,
      inputData,
      moduleType,
      moduleDef,
      systemPrompt,
      onProgress
    );
  };
};
