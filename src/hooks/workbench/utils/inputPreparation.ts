
/**
 * Input Preparation Utility
 * 
 * Purpose: Handles preparation of input data for different module types
 */

import { ModuleKind } from "@/data/modules";

/**
 * Prepare input data for module processing (updated for position awareness)
 */
export function prepareModuleInput(inputData: any, moduleType: ModuleKind): any {
  if (!inputData) return inputData;
  
  console.log(`Preparing input for ${moduleType}:`, typeof inputData, inputData ? Object.keys(inputData) : 'null');
  
  // For paragraph splitter, ensure we have processable content
  if (moduleType === 'paragraph-splitter') {
    // Prioritize processable content for AI processing
    if (inputData.processableContent && typeof inputData.processableContent === 'string') {
      return { 
        content: inputData.processableContent,
        // Preserve position mapping for later use
        positionMap: inputData.positionMap,
        originalContent: inputData.originalContent
      };
    }
    
    // Fallback to existing structure
    if (inputData.content && typeof inputData.content === 'string') {
      return { content: inputData.content };
    }
    
    // If it's already in the expected format, return as-is
    if (typeof inputData === 'string') {
      return { content: inputData };
    }
  }
  
  // For grammar checker, preserve paragraph structure for individual processing
  if (moduleType === 'grammar-checker') {
    // If we have structured paragraph data, preserve it
    if (inputData?.output?.paragraphs && Array.isArray(inputData.output.paragraphs)) {
      console.log(`Grammar checker: preserving ${inputData.output.paragraphs.length} paragraphs for individual processing`);
      return inputData; // Keep the full structure
    }
    
    // If we have direct paragraphs array, preserve it
    if (inputData?.paragraphs && Array.isArray(inputData.paragraphs)) {
      console.log(`Grammar checker: preserving ${inputData.paragraphs.length} direct paragraphs for individual processing`);
      return inputData; // Keep the full structure
    }
  }
  
  // For citation finder, it can handle both structured and text data, so preserve as-is
  if (moduleType === 'citation-finder') {
    console.log(`Citation finder: preserving input structure for flexible processing`);
    return inputData; // Let citation finder handle the data format detection
  }
  
  return inputData;
}

/**
 * Extract clean content based on module type (prioritizes processable content)
 */
export function extractCleanContent(inputData: any, moduleType: ModuleKind): string {
  if (typeof inputData === 'string') {
    return inputData;
  }
  
  if (typeof inputData === 'object' && inputData !== null) {
    // For paragraph splitter, prioritize processable content
    if (moduleType === 'paragraph-splitter') {
      if (inputData.content && typeof inputData.content === 'string') {
        return inputData.content;
      }
      // Also check for processable content directly
      if (inputData.processableContent && typeof inputData.processableContent === 'string') {
        return inputData.processableContent;
      }
    }
    
    // For grammar checker, DON'T convert to string if we have paragraph structure
    if (moduleType === 'grammar-checker') {
      if (inputData?.output?.paragraphs && Array.isArray(inputData.output.paragraphs)) {
        // Return structured data, not string - this allows batch processing to work
        return inputData;
      }
      if (inputData?.paragraphs && Array.isArray(inputData.paragraphs)) {
        // Return structured data, not string - this allows batch processing to work
        return inputData;
      }
    }
    
    // For citation finder, also preserve structure when available
    if (moduleType === 'citation-finder') {
      // Don't convert to JSON string, let the citation finder handle it
      return inputData;
    }
    
    // For other modules, return JSON representation
    return JSON.stringify(inputData, null, 2);
  }
  
  return String(inputData);
}
