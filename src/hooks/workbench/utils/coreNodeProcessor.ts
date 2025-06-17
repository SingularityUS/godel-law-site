
/**
 * Core Node Processor
 * 
 * Purpose: Core processing logic for individual nodes with minimal cleaning support
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { parseJsonResponse, parseGrammarResponse, parseParagraphSplitterResponse } from "./parsing";

export const createCoreProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (node: HelperNode, inputData: string, systemPrompt: string, moduleType: ModuleKind): Promise<any> => {
    console.log(`=== CORE PROCESSOR: ${moduleType} (Minimal Cleaning Mode) ===`);
    console.log('Input data type:', typeof inputData);
    console.log('Input data preview:', inputData.substring(0, 200) + '...');
    
    // Clean and prepare input data based on module type (prioritizes processable content)
    const cleanedInput = prepareInputForModule(inputData, moduleType);
    console.log('Prepared input preview:', cleanedInput.substring(0, 200) + '...');
    
    // Enhanced system prompt based on module type
    const enhancedPrompt = enhancePromptForModule(systemPrompt, moduleType);
    
    try {
      const result = await callChatGPT(enhancedPrompt, cleanedInput);
      console.log('ChatGPT response type:', typeof result);
      console.log('ChatGPT response preview:', typeof result === 'string' ? result.substring(0, 200) + '...' : JSON.stringify(result).substring(0, 200) + '...');
      
      // Parse response based on module type
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
          preservesPositions: true // Flag indicating this processing preserves position tracking
        }
      };
    } catch (error) {
      console.error(`Error in core processor for ${moduleType}:`, error);
      throw error;
    }
  };
};

/**
 * Prepare input data for specific module types (updated for minimal cleaning)
 */
function prepareInputForModule(inputData: string, moduleType: ModuleKind): string {
  console.log(`Preparing input for module: ${moduleType} (minimal cleaning mode)`);
  
  try {
    // Try to parse as JSON to extract processable content
    const parsed = JSON.parse(inputData);
    
    if (moduleType === 'paragraph-splitter') {
      // For paragraph splitter, prioritize processable content over original
      if (parsed.processableContent && typeof parsed.processableContent === 'string') {
        console.log('Using processable content for paragraph splitter');
        return parsed.processableContent.trim();
      }
      
      // Fallback to original content if processable not available
      if (parsed.originalContent && typeof parsed.originalContent === 'string') {
        console.log('Fallback to original content for paragraph splitter');
        return parsed.originalContent.trim();
      }
      
      // Legacy support for existing content structure
      if (parsed.content && typeof parsed.content === 'string') {
        console.log('Using legacy content structure for paragraph splitter');
        return parsed.content.trim();
      }
      
      // If it's already processed paragraphs, extract text from them
      if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
        const combinedText = parsed.paragraphs
          .map((p: any) => p.content || p.text || '')
          .filter((text: string) => text.length > 0)
          .join('\n\n');
        console.log('Combined text from existing paragraphs for re-processing');
        return combinedText;
      }
      
      // If it has output.content, use that
      if (parsed.output && parsed.output.content) {
        console.log('Extracted content from output wrapper');
        return parsed.output.content.trim();
      }
    }
    
    if (moduleType === 'grammar-checker') {
      // For grammar checker, we need paragraph content with position information
      if (parsed.output && parsed.output.paragraphs && Array.isArray(parsed.output.paragraphs)) {
        console.log('Prepared paragraph data for grammar checker with position tracking');
        return JSON.stringify({
          paragraphs: parsed.output.paragraphs.map((p: any) => ({
            id: p.id,
            content: p.content || p.text || '',
            wordCount: p.wordCount || 0,
            // Preserve any position information that might be available
            originalStart: p.originalStart,
            originalEnd: p.originalEnd,
            cleanedStart: p.cleanedStart,
            cleanedEnd: p.cleanedEnd
          })),
          // Include position mapping if available for future redlining
          positionMap: parsed.positionMap
        }, null, 2);
      }
    }
    
    // For other modules, prioritize processable content
    if (parsed.processableContent) {
      console.log('Using processable content for AI processing');
      return parsed.processableContent;
    }
    if (parsed.originalContent) {
      console.log('Using original content (no processable version available)');
      return parsed.originalContent;
    }
    if (parsed.content) {
      return parsed.content;
    }
    if (parsed.output && parsed.output.content) {
      return parsed.output.content;
    }
    
    // If we can't extract specific content, return the original parsed data as JSON
    return JSON.stringify(parsed, null, 2);
    
  } catch (error) {
    console.log('Input is not JSON, using as-is');
    // If not JSON, return as-is
    return inputData.trim();
  }
}

/**
 * Enhance system prompt based on module type
 */
function enhancePromptForModule(basePrompt: string, moduleType: ModuleKind): string {
  const moduleSpecificInstructions = {
    'paragraph-splitter': `
CRITICAL INSTRUCTIONS FOR PARAGRAPH SPLITTING:
- You are receiving CLEAN TEXT CONTENT only
- Do NOT include any JSON metadata in paragraph content
- Extract and return ONLY the actual paragraph text
- Each paragraph should contain complete, readable sentences
- Preserve all original text content without truncation
- Return valid JSON with this exact structure:
{
  "paragraphs": [
    {
      "id": "para-1",
      "content": "Full paragraph text here...",
      "type": "body",
      "sectionNumber": "",
      "wordCount": 50
    }
  ],
  "totalParagraphs": 6,
  "documentType": "legal"
}`,
    
    'grammar-checker': `
CRITICAL INSTRUCTIONS FOR GRAMMAR CHECKING:
- Process each paragraph individually
- Preserve the original paragraph structure
- Return corrections and suggestions for each paragraph
- Maintain the original text length and meaning`,
    
    'legal-analyzer': `
CRITICAL INSTRUCTIONS FOR LEGAL ANALYSIS:
- Analyze the legal content thoroughly
- Identify key legal concepts and issues
- Provide structured analysis with citations`
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
    case 'paragraph-splitter':
      return parseParagraphSplitterResponse(response);
      
    case 'grammar-checker':
      return parseGrammarResponse(response);
      
    default:
      // Pass moduleType as second argument to parseJsonResponse
      return parseJsonResponse(response, moduleType);
  }
}
