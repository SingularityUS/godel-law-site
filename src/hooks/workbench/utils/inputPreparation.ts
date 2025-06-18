
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
  
  // For citation finder, preserve the full paragraph structure
  if (moduleType === 'citation-finder') {
    // Return the full structured data without conversion
    return inputData;
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
    
    // For citation finder, don't extract - it needs the full structure
    if (moduleType === 'citation-finder') {
      // Citation finder expects structured data, not extracted text
      return JSON.stringify(inputData, null, 2);
    }
    
    // For other modules, return JSON representation
    return JSON.stringify(inputData, null, 2);
  }
  
  return String(inputData);
}
