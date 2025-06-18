
/**
 * Input Preparation Utility
 * 
 * Purpose: Handles preparation of input data for different module types
 */

import { ModuleKind } from "@/data/modules";

/**
 * Prepare input data for module processing (updated for position awareness and document metadata preservation)
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
        originalContent: inputData.originalContent,
        // Preserve document metadata
        metadata: {
          ...inputData.metadata,
          fileName: inputData.fileName || inputData.metadata?.fileName,
          fileType: inputData.fileType || inputData.metadata?.fileType,
          originalContent: inputData.originalContent || inputData.metadata?.originalContent
        }
      };
    }
    
    // Fallback to existing structure
    if (inputData.content && typeof inputData.content === 'string') {
      return { 
        content: inputData.content,
        metadata: {
          ...inputData.metadata,
          originalContent: inputData.originalContent || inputData.content
        }
      };
    }
    
    // If it's already in the expected format, return as-is but ensure metadata
    if (typeof inputData === 'string') {
      return { 
        content: inputData,
        metadata: {
          originalContent: inputData
        }
      };
    }
  }
  
  // For other modules, preserve document metadata
  if (inputData && typeof inputData === 'object') {
    return {
      ...inputData,
      metadata: {
        ...inputData.metadata,
        fileName: inputData.fileName || inputData.metadata?.fileName,
        fileType: inputData.fileType || inputData.metadata?.fileType,
        originalContent: inputData.originalContent || inputData.metadata?.originalContent || inputData.content
      }
    };
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
    
    // For other modules, return JSON representation
    return JSON.stringify(inputData, null, 2);
  }
  
  return String(inputData);
}
