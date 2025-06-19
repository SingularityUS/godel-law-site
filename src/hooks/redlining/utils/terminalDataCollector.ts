
/**
 * Terminal Data Collection Utility
 * 
 * Purpose: Collects and processes data from terminal modules with enhanced error handling
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
 * Collect data from all terminal modules with enhanced robustness
 */
export const collectTerminalData = (
  pipelineOutput: any,
  terminalModules: TerminalModule[]
): TerminalModuleData[] => {
  console.log('=== COLLECTING TERMINAL DATA (Enhanced) ===');
  console.log('Pipeline output for data collection:', {
    hasResults: !!pipelineOutput.results,
    resultsLength: pipelineOutput.results?.length || 0,
    hasEndpointResults: !!pipelineOutput.endpointResults,
    endpointResultsLength: pipelineOutput.endpointResults?.length || 0,
    hasPipelineResults: !!pipelineOutput.pipelineResults,
    pipelineResultsLength: pipelineOutput.pipelineResults?.length || 0,
    terminalModuleCount: terminalModules.length
  });
  
  const terminalData: TerminalModuleData[] = [];
  
  // Try multiple data sources
  const dataSources = [
    { name: 'endpointResults', data: pipelineOutput.endpointResults },
    { name: 'results', data: pipelineOutput.results },
    { name: 'pipelineResults', data: pipelineOutput.pipelineResults }
  ];
  
  let resultsData: any[] = [];
  
  // Find the best data source
  for (const source of dataSources) {
    if (source.data && Array.isArray(source.data) && source.data.length > 0) {
      resultsData = source.data;
      console.log(`Using ${source.name} for data collection (${resultsData.length} items)`);
      break;
    }
  }
  
  if (resultsData.length === 0) {
    console.warn('No results data found in pipeline output');
    return [];
  }
  
  terminalModules.forEach(terminal => {
    console.log(`Processing terminal module: ${terminal.moduleType} (${terminal.nodeId})`);
    
    try {
      // Find the corresponding result data
      const resultData = resultsData.find((r: any) => r.nodeId === terminal.nodeId);
      
      if (!resultData || !resultData.result) {
        console.warn(`No result data found for terminal module: ${terminal.nodeId}`);
        return;
      }
      
      console.log(`Found result data for ${terminal.moduleType}:`, {
        hasResult: !!resultData.result,
        resultKeys: Object.keys(resultData.result || {}),
        hasMetadata: !!resultData.result.metadata,
        hasOutput: !!resultData.result.output
      });
      
      const moduleData: TerminalModuleData = {
        nodeId: terminal.nodeId,
        moduleType: terminal.moduleType,
        suggestions: [],
        originalContent: extractOriginalContent(resultData.result),
        metadata: resultData.result.metadata || {}
      };
      
      // Extract suggestions based on module type with better error handling
      try {
        const suggestions = extractSuggestionsForModule(resultData.result, terminal, terminal.nodeId);
        moduleData.suggestions = suggestions;
        console.log(`Extracted ${suggestions.length} suggestions from ${terminal.moduleType}`);
      } catch (error) {
        console.error(`Error extracting suggestions from ${terminal.moduleType}:`, error);
        // Continue processing other modules even if one fails
      }
      
      terminalData.push(moduleData);
      console.log(`Terminal data processed: ${moduleData.suggestions.length} suggestions, originalContent: ${moduleData.originalContent?.length || 0} chars`);
      
    } catch (error) {
      console.error(`Error processing terminal module ${terminal.nodeId}:`, error);
      // Continue with next module
    }
  });
  
  console.log(`Total terminal data collected: ${terminalData.length} modules`);
  return terminalData;
};

/**
 * Extract suggestions for a specific module type
 */
function extractSuggestionsForModule(
  resultData: any,
  terminal: TerminalModule,
  sourceId: string
): RedlineSuggestion[] {
  switch (terminal.moduleType) {
    case 'grammar-analysis':
    case 'grammar-checker':
      return extractGrammarSuggestions(resultData, sourceId);
      
    case 'citation-finder':
    case 'citation-verifier':
      return extractCitationSuggestions(resultData, sourceId);
      
    default:
      console.log(`No specific extractor for module type: ${terminal.moduleType}`);
      
      // Fallback: try to extract any analyzable data
      if (hasGrammarLikeData(resultData)) {
        console.log('Attempting grammar extraction as fallback');
        return extractGrammarSuggestions(resultData, sourceId);
      }
      
      if (hasCitationLikeData(resultData)) {
        console.log('Attempting citation extraction as fallback');
        return extractCitationSuggestions(resultData, sourceId);
      }
      
      return [];
  }
}

/**
 * Check if result data contains grammar-like analysis
 */
function hasGrammarLikeData(resultData: any): boolean {
  return !!(
    resultData?.output?.analysis ||
    resultData?.finalOutput?.output?.analysis ||
    resultData?.analysis
  );
}

/**
 * Check if result data contains citation-like data
 */
function hasCitationLikeData(resultData: any): boolean {
  return !!(
    resultData?.citations ||
    resultData?.output?.citations ||
    resultData?.result?.citations
  );
}
