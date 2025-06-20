
/**
 * Terminal Data Collector
 * 
 * Purpose: Collects data from terminal modules with correct content sourcing
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
  console.log('=== COLLECTING TERMINAL DATA (CORRECTED CONTENT SOURCING) ===');
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
    
    // Extract original content using corrected sourcing - pass pipeline results for tracing
    console.log(`🎯 EXTRACTING CONTENT FOR ${terminalModule.moduleType.toUpperCase()}`);
    const originalContent = extractOriginalContent(moduleResult.result || moduleResult, pipelineResults);
    console.log(`Extracted content length: ${originalContent.length}`);
    
    if (originalContent.length === 0) {
      console.error(`❌ NO CONTENT EXTRACTED FOR ${terminalModule.moduleType} - WILL CAUSE POSITION ISSUES`);
    }
    
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
      
      // CRITICAL: Validate that citation positions are within content bounds
      const contentLength = originalContent.length;
      const validSuggestions = suggestions.filter(suggestion => {
        const isValid = suggestion.startPos >= 0 && 
                       suggestion.endPos <= contentLength && 
                       suggestion.startPos < suggestion.endPos;
        
        if (!isValid) {
          console.error(`❌ INVALID CITATION POSITION:`, {
            id: suggestion.id,
            startPos: suggestion.startPos,
            endPos: suggestion.endPos,
            contentLength,
            originalText: suggestion.originalText
          });
        } else {
          // Validate the text at those positions
          const actualText = originalContent.substring(suggestion.startPos, suggestion.endPos);
          if (actualText !== suggestion.originalText) {
            console.warn(`⚠️ CITATION TEXT MISMATCH:`, {
              id: suggestion.id,
              expected: suggestion.originalText,
              actual: actualText,
              startPos: suggestion.startPos,
              endPos: suggestion.endPos
            });
          } else {
            console.log(`✅ CITATION POSITION VALIDATED:`, {
              id: suggestion.id,
              text: suggestion.originalText,
              positions: `${suggestion.startPos}-${suggestion.endPos}`
            });
          }
        }
        
        return isValid;
      });
      
      if (validSuggestions.length !== suggestions.length) {
        console.error(`❌ FILTERED OUT ${suggestions.length - validSuggestions.length} INVALID CITATIONS`);
      }
      
      suggestions = validSuggestions;
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
        sourceModule: terminalModule.moduleType,
        contentLength: originalContent.length,
        contentSource: 'traced-from-pipeline'
      }
    };
    
    console.log(`✅ CREATED TERMINAL DATA FOR ${terminalModule.nodeId}:`, {
      moduleType: moduleData.moduleType,
      contentLength: moduleData.originalContent.length,
      suggestionsCount: moduleData.suggestions.length,
      suggestionTypes: moduleData.suggestions.map(s => s.type),
      contentPreview: moduleData.originalContent.substring(0, 100) + '...'
    });
    
    terminalData.push(moduleData);
  });
  
  console.log(`📊 TERMINAL DATA COLLECTION SUMMARY:`, {
    totalModules: terminalData.length,
    contentLengths: terminalData.map(d => d.originalContent.length),
    totalSuggestions: terminalData.reduce((sum, d) => sum + d.suggestions.length, 0)
  });
  
  return terminalData;
};
