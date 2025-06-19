
/**
 * Terminal Data Collection Utility
 * 
 * Purpose: Collects and processes data from terminal modules
 */

import { RedlineSuggestion } from "@/types/redlining";
import { TerminalModule } from "./terminalModuleDetector";
import { extractGrammarSuggestions } from "./extractors/grammarExtractor";
import { extractCitationSuggestions } from "./extractors/citationExtractor";
import { extractOriginalContent } from "./extractors/contentExtractor";

export interface TerminalModuleData {
  nodeId: string;
  moduleType: string;
  suggestions: RedlineSuggestion[];
  originalContent?: string;
  metadata?: any;
}

/**
 * Collect data from all terminal modules
 */
export const collectTerminalData = (
  pipelineOutput: any,
  terminalModules: TerminalModule[]
): TerminalModuleData[] => {
  console.log('=== COLLECTING TERMINAL DATA ===');
  
  const terminalData: TerminalModuleData[] = [];
  
  // Get the actual results data
  const resultsData = pipelineOutput.endpointResults || pipelineOutput.pipelineResults || [];
  
  terminalModules.forEach(terminal => {
    console.log(`Processing terminal module: ${terminal.moduleType} (${terminal.nodeId})`);
    
    // Find the corresponding result data
    const resultData = resultsData.find((r: any) => r.nodeId === terminal.nodeId);
    
    if (!resultData || !resultData.result) {
      console.warn(`No result data found for terminal module: ${terminal.nodeId}`);
      return;
    }
    
    const moduleData: TerminalModuleData = {
      nodeId: terminal.nodeId,
      moduleType: terminal.moduleType,
      suggestions: [],
      originalContent: extractOriginalContent(resultData.result),
      metadata: resultData.result.metadata
    };
    
    // Extract suggestions based on module type
    try {
      switch (terminal.moduleType) {
        case 'grammar-analysis':
        case 'grammar-checker':
          moduleData.suggestions = extractGrammarSuggestions(resultData.result, terminal.nodeId);
          console.log(`Extracted ${moduleData.suggestions.length} grammar suggestions`);
          break;
          
        case 'citation-finder':
        case 'citation-verifier':
          moduleData.suggestions = extractCitationSuggestions(resultData.result, terminal.nodeId);
          console.log(`Extracted ${moduleData.suggestions.length} citation suggestions`);
          break;
          
        default:
          console.log(`No specific extractor for module type: ${terminal.moduleType}`);
      }
    } catch (error) {
      console.error(`Error extracting data from ${terminal.moduleType}:`, error);
    }
    
    terminalData.push(moduleData);
    console.log(`Terminal data processed: ${moduleData.suggestions.length} suggestions`);
  });
  
  console.log(`Total terminal data collected: ${terminalData.length} modules`);
  return terminalData;
};
