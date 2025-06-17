
/**
 * Core Node Processor
 * 
 * Purpose: Core processing logic for individual nodes with streamlined redlining support
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { parseJsonResponse, parseGrammarResponse, parseParagraphSplitterResponse } from "./parsing";
import { processParagraphSplitter } from "./moduleProcessors/paragraphSplitterProcessor";
import { processGrammarAnalysis } from "./moduleProcessors/grammarAnalysisProcessor";

export const createCoreProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (node: HelperNode, inputData: string, systemPrompt: string, moduleType: ModuleKind): Promise<any> => {
    console.log(`=== CORE PROCESSOR: ${moduleType} (Streamlined Redlining Mode) ===`);
    console.log('Input data type:', typeof inputData);
    console.log('Input data preview:', inputData.substring(0, 200) + '...');
    
    // Use streamlined processors for redlining modules
    if (moduleType === 'paragraph-splitter') {
      console.log('Using deterministic paragraph splitter');
      const result = await processParagraphSplitter(inputData);
      return {
        output: result.output,
        metadata: {
          moduleType,
          processingTime: Date.now(),
          timestamp: new Date().toISOString(),
          method: 'deterministic',
          redliningReady: true,
          ...result.metadata
        }
      };
    }
    
    if (moduleType === 'grammar-checker') {
      console.log('Using streamlined grammar analysis');
      
      // Progress callback for grammar analysis
      const onProgress = (completed: number, total: number) => {
        console.log(`Grammar analysis progress: ${completed}/${total} paragraphs`);
      };
      
      const result = await processGrammarAnalysis(inputData, callChatGPT, onProgress);
      return {
        output: result.output,
        metadata: {
          moduleType,
          processingTime: result.metadata?.processingTime || Date.now(),
          timestamp: new Date().toISOString(),
          method: 'streamlined',
          redliningReady: true,
          positionAware: true,
          ...result.metadata
        }
      };
    }
    
    // For other modules, use existing logic with minimal changes
    const cleanedInput = prepareInputForModule(inputData, moduleType);
    console.log('Prepared input preview:', cleanedInput.substring(0, 200) + '...');
    
    const enhancedPrompt = enhancePromptForModule(systemPrompt, moduleType);
    
    try {
      const result = await callChatGPT(enhancedPrompt, cleanedInput);
      console.log('ChatGPT response type:', typeof result);
      console.log('ChatGPT response preview:', typeof result === 'string' ? result.substring(0, 200) + '...' : JSON.stringify(result).substring(0, 200) + '...');
      
      const parsed = parseModuleResponse(result, moduleType);
      console.log(`Parsed result: ${parsed.output?.paragraphs?.length || parsed.output?.analysis?.length || 'unknown'} items`);
      
      return {
        output: parsed.output,
        metadata: {
          moduleType,
          processingTime: Date.now(),
          timestamp: new Date().toISOString(),
          inputLength: cleanedInput.length,
          outputItems: parsed.output?.paragraphs?.length || parsed.output?.analysis?.length || 0,
          method: 'traditional'
        }
      };
    } catch (error) {
      console.error(`Error in core processor for ${moduleType}:`, error);
      throw error;
    }
  };
};

/**
 * Prepare input data for specific module types (updated for streamlined processing)
 */
function prepareInputForModule(inputData: string, moduleType: ModuleKind): string {
  console.log(`Preparing input for module: ${moduleType} (streamlined mode)`);
  
  try {
    const parsed = JSON.parse(inputData);
    
    // For traditional modules, use existing logic
    if (moduleType === 'text-extractor' || moduleType === 'citation-finder') {
      if (parsed.processableContent && typeof parsed.processableContent === 'string') {
        return parsed.processableContent.trim();
      }
      if (parsed.originalContent && typeof parsed.originalContent === 'string') {
        return parsed.originalContent.trim();
      }
      if (parsed.content && typeof parsed.content === 'string') {
        return parsed.content.trim();
      }
    }
    
    return JSON.stringify(parsed, null, 2);
    
  } catch (error) {
    console.log('Input is not JSON, using as-is');
    return inputData.trim();
  }
}

/**
 * Enhance system prompt based on module type
 */
function enhancePromptForModule(basePrompt: string, moduleType: ModuleKind): string {
  const moduleSpecificInstructions = {
    'text-extractor': `
CRITICAL INSTRUCTIONS FOR TEXT EXTRACTION:
- Extract and clean the text content
- Preserve important formatting
- Remove artifacts and noise`,
    
    'citation-finder': `
CRITICAL INSTRUCTIONS FOR CITATION FINDING:
- Identify all legal citations and references
- Extract case names, statutes, and authorities
- Provide structured citation data`
  };
  
  const enhancement = moduleSpecificInstructions[moduleType] || '';
  return `${basePrompt}\n\n${enhancement}`;
}

/**
 * Parse response based on module type
 */
function parseModuleResponse(response: any, moduleType: ModuleKind): any {
  console.log(`Parsing response for module: ${moduleType}`);
  
  switch (moduleType) {
    case 'text-extractor':
    case 'citation-finder':
    case 'citation-verifier':
    case 'style-guide-enforcer':
    case 'chatgpt-assistant':
    case 'custom':
      return parseJsonResponse(response, moduleType);
      
    default:
      return parseJsonResponse(response, moduleType);
  }
}
