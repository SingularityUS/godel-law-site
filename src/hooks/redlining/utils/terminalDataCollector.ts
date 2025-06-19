
/**
 * Terminal Data Collection Utility
 * 
 * Purpose: Collects and processes data from terminal modules with enhanced debugging for content truncation
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
 * Collect data from all terminal modules with systematic debugging for content issues
 */
export const collectTerminalData = (
  pipelineOutput: any,
  terminalModules: TerminalModule[]
): TerminalModuleData[] => {
  console.log('=== COLLECTING TERMINAL DATA (Systematic Content Debug) ===');
  console.log('🎯 Focus: Track where document content gets truncated');
  
  console.log('Pipeline output structure for debugging:', {
    hasResults: !!pipelineOutput.results,
    resultsLength: pipelineOutput.results?.length || 0,
    hasEndpointResults: !!pipelineOutput.endpointResults,
    endpointResultsLength: pipelineOutput.endpointResults?.length || 0,
    hasPipelineResults: !!pipelineOutput.pipelineResults,
    pipelineResultsLength: pipelineOutput.pipelineResults?.length || 0,
    terminalModuleCount: terminalModules.length,
    hasMetadata: !!pipelineOutput.metadata,
    hasOriginalPreview: !!pipelineOutput.metadata?.originalPreview
  });
  
  // Log original document content if available in pipeline output
  if (pipelineOutput.metadata?.originalPreview) {
    console.log('📄 Original document preview in pipeline:', {
      length: pipelineOutput.metadata.originalPreview.length,
      preview: pipelineOutput.metadata.originalPreview.substring(0, 200)
    });
  }
  
  const terminalData: TerminalModuleData[] = [];
  
  // Try multiple data sources with detailed logging
  const dataSources = [
    { name: 'endpointResults', data: pipelineOutput.endpointResults },
    { name: 'results', data: pipelineOutput.results },
    { name: 'pipelineResults', data: pipelineOutput.pipelineResults }
  ];
  
  let resultsData: any[] = [];
  
  // Find the best data source and log each one
  for (const source of dataSources) {
    console.log(`Checking data source: ${source.name}`, {
      exists: !!source.data,
      isArray: Array.isArray(source.data),
      length: Array.isArray(source.data) ? source.data.length : 0
    });
    
    if (source.data && Array.isArray(source.data) && source.data.length > 0) {
      resultsData = source.data;
      console.log(`✅ Using ${source.name} for data collection (${resultsData.length} items)`);
      
      // Log structure of first result for debugging
      if (resultsData[0]) {
        console.log(`Structure of first result from ${source.name}:`, {
          hasResult: !!resultsData[0].result,
          hasMetadata: !!resultsData[0].result?.metadata,
          hasInput: !!resultsData[0].result?.input,
          hasOriginalContent: !!resultsData[0].result?.originalContent,
          nodeId: resultsData[0].nodeId,
          resultKeys: Object.keys(resultsData[0].result || {})
        });
      }
      break;
    }
  }
  
  if (resultsData.length === 0) {
    console.error('❌ No results data found in pipeline output');
    console.log('Available pipeline output keys:', Object.keys(pipelineOutput));
    return [];
  }
  
  terminalModules.forEach((terminal, index) => {
    console.log(`\n=== Processing Terminal Module ${index + 1}/${terminalModules.length} ===`);
    console.log(`Module: ${terminal.moduleType} (${terminal.nodeId})`);
    
    try {
      // Find the corresponding result data
      const resultData = resultsData.find((r: any) => r.nodeId === terminal.nodeId);
      
      if (!resultData || !resultData.result) {
        console.warn(`❌ No result data found for terminal module: ${terminal.nodeId}`);
        return;
      }
      
      console.log(`✅ Found result data for ${terminal.moduleType}`);
      console.log('Result data structure:', {
        hasResult: !!resultData.result,
        resultKeys: Object.keys(resultData.result || {}),
        hasMetadata: !!resultData.result.metadata,
        hasOutput: !!resultData.result.output,
        hasInput: !!resultData.result.input,
        hasOriginalContent: !!resultData.result.originalContent
      });
      
      // Extract original content with detailed logging
      console.log('🔍 Extracting original content...');
      const originalContent = extractOriginalContent(resultData.result);
      
      console.log('Original content extraction result:', {
        found: !!originalContent,
        length: originalContent?.length || 0,
        preview: originalContent?.substring(0, 100) || 'N/A'
      });
      
      const moduleData: TerminalModuleData = {
        nodeId: terminal.nodeId,
        moduleType: terminal.moduleType,
        suggestions: [],
        originalContent: originalContent,
        metadata: resultData.result.metadata || {}
      };
      
      // Extract suggestions with error handling
      try {
        console.log('🔍 Extracting suggestions...');
        const suggestions = extractSuggestionsForModule(resultData.result, terminal, terminal.nodeId);
        moduleData.suggestions = suggestions;
        console.log(`✅ Extracted ${suggestions.length} suggestions from ${terminal.moduleType}`);
        
        // Log each suggestion for debugging
        suggestions.forEach((suggestion, idx) => {
          console.log(`Suggestion ${idx + 1}: ${suggestion.originalText} → ${suggestion.suggestedText} (pos: ${suggestion.startPos}-${suggestion.endPos})`);
        });
        
      } catch (error) {
        console.error(`❌ Error extracting suggestions from ${terminal.moduleType}:`, error);
        // Continue processing other modules even if one fails
      }
      
      terminalData.push(moduleData);
      console.log(`✅ Terminal module processed: ${moduleData.suggestions.length} suggestions, originalContent: ${moduleData.originalContent?.length || 0} chars`);
      
    } catch (error) {
      console.error(`❌ Error processing terminal module ${terminal.nodeId}:`, error);
      // Continue with next module
    }
  });
  
  console.log('\n=== TERMINAL DATA COLLECTION SUMMARY ===');
  console.log(`Total modules processed: ${terminalData.length}`);
  console.log('Content lengths:', terminalData.map(d => ({
    module: d.moduleType,
    contentLength: d.originalContent?.length || 0,
    suggestionCount: d.suggestions.length
  })));
  
  // Find the module with the longest content (most complete)
  const moduleWithMostContent = terminalData.reduce((max, current) => 
    (current.originalContent?.length || 0) > (max.originalContent?.length || 0) ? current : max
  , terminalData[0]);
  
  if (moduleWithMostContent) {
    console.log(`📄 Module with most content: ${moduleWithMostContent.moduleType} (${moduleWithMostContent.originalContent?.length || 0} chars)`);
  }
  
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

function hasGrammarLikeData(resultData: any): boolean {
  return !!(
    resultData?.output?.analysis ||
    resultData?.finalOutput?.output?.analysis ||
    resultData?.analysis
  );
}

function hasCitationLikeData(resultData: any): boolean {
  return !!(
    resultData?.citations ||
    resultData?.output?.citations ||
    resultData?.result?.citations
  );
}
