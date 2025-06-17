
/**
 * Core Node Processor
 * 
 * Purpose: Handles the actual ChatGPT API calls and response processing
 */

import { HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { parseJsonResponse } from "./parsing/responseParser";
import { parseGrammarResponse } from "./parsing/grammarResponseParser";
import { parseParagraphSplitterResponse } from "./parsing/paragraphSplitterParser";

export const createCoreProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (
    node: HelperNode,
    promptData: string,
    systemPrompt: string,
    moduleType: ModuleKind
  ) => {
    console.log(`Processing ${moduleType} with ${promptData.length} characters of data`);
    
    // Call ChatGPT API
    const response = await callChatGPT(systemPrompt, promptData);
    
    // Parse response based on module type
    let parsedOutput: any;
    
    if (moduleType === 'paragraph-splitter') {
      parsedOutput = parseParagraphSplitterResponse(response);
    } else if (moduleType === 'grammar-checker') {
      parsedOutput = parseGrammarResponse(response);
    } else {
      parsedOutput = parseJsonResponse(response, moduleType);
    }
    
    // Ensure we have a consistent output structure
    if (typeof parsedOutput === 'string' || !parsedOutput.output) {
      parsedOutput = {
        output: parsedOutput,
        rawResponse: response
      };
    }
    
    // Add metadata
    const result = {
      ...parsedOutput,
      metadata: {
        ...parsedOutput.metadata,
        moduleType: moduleType,
        nodeId: node.id,
        processingTime: Date.now(),
        responseLength: response.length
      }
    };
    
    // Log processing results
    if (result.output) {
      if (Array.isArray(result.output.paragraphs)) {
        console.log(`${moduleType} processed successfully: ${result.output.paragraphs.length} paragraphs`);
      } else if (Array.isArray(result.output.analysis)) {
        console.log(`${moduleType} processed successfully: ${result.output.analysis.length} analysis items`);
      } else {
        console.log(`${moduleType} processed successfully`);
      }
    }
    
    return result;
  };
};
