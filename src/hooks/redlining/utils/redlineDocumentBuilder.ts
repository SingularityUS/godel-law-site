
/**
 * Redline Document Builder
 * 
 * Purpose: Creates unified redline document from terminal module data
 */

import { RedlineDocument } from "@/types/redlining";
import { TerminalModuleData } from "./terminalDataCollector";

/**
 * Create redline document from terminal module data
 */
export const createRedlineDocument = (
  terminalData: TerminalModuleData[]
): RedlineDocument | null => {
  console.log('=== CREATING REDLINE DOCUMENT ===');
  
  if (terminalData.length === 0) {
    console.warn('No terminal data provided');
    return null;
  }
  
  // Find original content (prefer the first module that has it)
  let originalContent = '';
  for (const data of terminalData) {
    if (data.originalContent && data.originalContent.length > 0) {
      originalContent = data.originalContent;
      console.log(`Using original content from ${data.moduleType} (${originalContent.length} chars)`);
      break;
    }
  }
  
  if (!originalContent) {
    console.error('No original content found in any terminal module');
    return null;
  }
  
  // Combine all suggestions from all terminal modules
  const allSuggestions = terminalData.flatMap(data => data.suggestions);
  console.log(`Combined ${allSuggestions.length} suggestions from ${terminalData.length} modules`);
  
  // Create metadata
  const sourceModules = terminalData.map(data => data.moduleType);
  const fileName = terminalData[0]?.metadata?.fileName || 'Document';
  
  const redlineDocument: RedlineDocument = {
    id: `redline-${Date.now()}`,
    originalContent,
    currentContent: originalContent,
    suggestions: allSuggestions,
    metadata: {
      fileName,
      fileType: terminalData[0]?.metadata?.fileType || 'text/plain',
      lastModified: new Date().toISOString(),
      totalSuggestions: allSuggestions.length,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0,
      sourceModules
    }
  };
  
  console.log('Redline document created:', {
    id: redlineDocument.id,
    fileName: redlineDocument.metadata.fileName,
    suggestionCount: redlineDocument.suggestions.length,
    sourceModules: redlineDocument.metadata.sourceModules
  });
  
  return redlineDocument;
};
