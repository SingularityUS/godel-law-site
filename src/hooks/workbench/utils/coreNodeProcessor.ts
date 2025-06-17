
/**
 * Core Node Processor
 * 
 * Purpose: Handles the actual ChatGPT API calls and response processing with enhanced validation
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
    
    // Call ChatGPT API with proper error handling
    let response: any;
    try {
      response = await callChatGPT(systemPrompt, promptData);
      console.log(`ChatGPT API response received for ${moduleType}, type: ${typeof response}, length: ${typeof response === 'string' ? response.length : 'N/A'}`);
    } catch (error) {
      console.error(`ChatGPT API call failed for ${moduleType}:`, error);
      return {
        output: {
          error: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          moduleType: moduleType
        },
        metadata: {
          moduleType: moduleType,
          nodeId: node.id,
          processingTime: Date.now(),
          error: true
        }
      };
    }
    
    // Validate response
    if (response === null || response === undefined) {
      console.error(`No response received from ChatGPT for ${moduleType}`);
      return {
        output: {
          error: 'No response received from ChatGPT',
          moduleType: moduleType
        },
        metadata: {
          moduleType: moduleType,
          nodeId: node.id,
          processingTime: Date.now(),
          error: true
        }
      };
    }
    
    // Parse response based on module type with enhanced error handling
    let parsedOutput: any;
    
    try {
      if (moduleType === 'paragraph-splitter') {
        parsedOutput = parseParagraphSplitterResponse(response);
        console.log(`Paragraph splitter parsing complete:`, {
          hasParagraphs: !!parsedOutput.output?.paragraphs,
          paragraphCount: parsedOutput.output?.paragraphs?.length || 0,
          hasError: !!parsedOutput.output?.error
        });
      } else if (moduleType === 'grammar-checker') {
        parsedOutput = parseGrammarResponse(response);
        console.log(`Grammar checker parsing complete:`, {
          hasAnalysis: !!parsedOutput.output?.analysis,
          analysisCount: Array.isArray(parsedOutput.output?.analysis) ? parsedOutput.output.analysis.length : 0,
          hasError: !!parsedOutput.output?.error
        });
      } else {
        parsedOutput = parseJsonResponse(response, moduleType);
        console.log(`Generic JSON parsing complete for ${moduleType}`);
      }
    } catch (parseError) {
      console.error(`Parsing failed for ${moduleType}:`, parseError);
      parsedOutput = {
        output: {
          error: `Parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          rawResponse: response,
          moduleType: moduleType
        }
      };
    }
    
    // Ensure we have a consistent output structure
    if (typeof parsedOutput === 'string' || !parsedOutput.output) {
      parsedOutput = {
        output: parsedOutput,
        rawResponse: response
      };
    }
    
    // Add comprehensive metadata
    const result = {
      ...parsedOutput,
      metadata: {
        ...parsedOutput.metadata,
        moduleType: moduleType,
        nodeId: node.id,
        processingTime: Date.now(),
        responseLength: typeof response === 'string' ? response.length : JSON.stringify(response).length,
        responseType: typeof response,
        timestamp: new Date().toISOString()
      }
    };
    
    // Log processing results with detailed statistics
    if (result.output && !result.output.error) {
      if (Array.isArray(result.output.paragraphs)) {
        console.log(`✅ ${moduleType} processed successfully: ${result.output.paragraphs.length} paragraphs generated`);
      } else if (Array.isArray(result.output.analysis)) {
        console.log(`✅ ${moduleType} processed successfully: ${result.output.analysis.length} analysis items generated`);
      } else if (result.output.totalParagraphs) {
        console.log(`✅ ${moduleType} processed successfully: ${result.output.totalParagraphs} total paragraphs`);
      } else {
        console.log(`✅ ${moduleType} processed successfully`);
      }
    } else {
      console.warn(`⚠️ ${moduleType} completed with errors:`, result.output?.error);
    }
    
    return result;
  };
};
