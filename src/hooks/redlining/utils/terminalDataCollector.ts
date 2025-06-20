
/**
 * Terminal Data Collector
 * 
 * Purpose: Collects data from terminal modules for redline processing
 */

import { extractGrammarSuggestions } from "./extractors/grammarExtractor";
import { extractCitationSuggestions } from "./extractors/citationExtractor";
import { extractOriginalContent } from "./extractors/contentExtractor";
import { RedlineSuggestion } from "@/types/redlining";

export interface TerminalModuleData {
  moduleType: string;
  nodeId: string;
  originalContent: string;
  suggestions: RedlineSuggestion[];
  metadata: any;
}

export const collectTerminalData = (
  pipelineOutput: any,
  terminalModules: Array<{ moduleType: string; nodeId: string }>
): TerminalModuleData[] => {
  console.log('=== COLLECTING TERMINAL DATA ===');
  console.log('Terminal modules to process:', terminalModules);
  
  const terminalData: TerminalModuleData[] = [];
  
  // Get pipeline results
  const pipelineResults = pipelineOutput.pipelineResults || pipelineOutput.results || [];
  console.log(`Found ${pipelineResults.length} pipeline results`);
  
  terminalModules.forEach(terminalModule => {
    console.log(`Processing terminal module: ${terminalModule.moduleType} (${terminalModule.nodeId})`);
    
    // Find the result for this terminal module
    const moduleResult = pipelineResults.find((result: any) => 
      result.nodeId === terminalModule.nodeId
    );
    
    if (!moduleResult) {
      console.warn(`No result found for terminal module ${terminalModule.nodeId}`);
      return;
    }
    
    console.log(`Found result for ${terminalModule.nodeId}:`, {
      hasResult: !!moduleResult.result,
      hasOutput: !!moduleResult.result?.output,
      resultKeys: moduleResult.result ? Object.keys(moduleResult.result) : [],
      outputKeys: moduleResult.result?.output ? Object.keys(moduleResult.result.output) : []
    });
    
    // Extract original content using the correct function
    const originalContent = extractOriginalContent(moduleResult.result || moduleResult);
    console.log(`Extracted content length: ${originalContent.length}`);
    
    // Extract suggestions based on module type
    let suggestions: RedlineSuggestion[] = [];
    
    if (terminalModule.moduleType === 'grammar-analysis') {
      console.log('Processing grammar analysis module');
      suggestions = extractGrammarSuggestions(moduleResult.result, terminalModule.nodeId);
      console.log(`Extracted ${suggestions.length} grammar suggestions`);
    } else if (terminalModule.moduleType === 'citation-finder') {
      console.log('Processing citation finder module');
      suggestions = extractCitationSuggestions(moduleResult.result, terminalModule.nodeId);
      console.log(`Extracted ${suggestions.length} citation suggestions`);
    } else {
      console.log(`Unknown terminal module type: ${terminalModule.moduleType}`);
    }
    
    const moduleData: TerminalModuleData = {
      moduleType: terminalModule.moduleType,
      nodeId: terminalModule.nodeId,
      originalContent,
      suggestions,
      metadata: {
        processingTime: moduleResult.result?.metadata?.processingTime,
        totalSuggestions: suggestions.length,
        sourceModule: terminalModule.moduleType
      }
    };
    
    console.log(`Created terminal data for ${terminalModule.nodeId}:`, {
      moduleType: moduleData.moduleType,
      contentLength: moduleData.originalContent.length,
      suggestionsCount: moduleData.suggestions.length,
      suggestionTypes: moduleData.suggestions.map(s => s.type)
    });
    
    terminalData.push(moduleData);
  });
  
  console.log(`Collected data from ${terminalData.length} terminal modules`);
  return terminalData;
};
