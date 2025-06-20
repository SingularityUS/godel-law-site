
/**
 * Terminal Data Collector
 * 
 * Purpose: Collects data from terminal modules with correct content sourcing and enhanced position validation
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
  console.log('=== COLLECTING TERMINAL DATA (ENHANCED POSITION VALIDATION) ===');
  console.log('Terminal modules to process:', terminalModules);
  
  const terminalData: TerminalModuleData[] = [];
  
  // Get pipeline results
  const pipelineResults = pipelineOutput.pipelineResults || pipelineOutput.results || [];
  console.log(`Found ${pipelineResults.length} pipeline results`);
  
  terminalModules.forEach(terminalModule => {
    console.log(`\n🔍 Processing terminal module: ${terminalModule.moduleType} (${terminalModule.nodeId})`);
    
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
    console.log(`Content preview: "${originalContent.substring(0, 150)}..."`);
    
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
      console.log('🎯 PROCESSING CITATION FINDER MODULE WITH ENHANCED VALIDATION');
      suggestions = extractCitationSuggestions(moduleResult.result, terminalModule.nodeId);
      console.log(`Extracted ${suggestions.length} citation suggestions`);
      
      // ENHANCED: Comprehensive citation position validation
      console.log(`\n🔍 CITATION POSITION VALIDATION (ENHANCED):`);
      const contentLength = originalContent.length;
      const validSuggestions: RedlineSuggestion[] = [];
      const originalSuggestionsCount = suggestions.length;
      
      suggestions.forEach((suggestion, index) => {
        console.log(`\n📍 VALIDATING CITATION ${index + 1}:`);
        console.log(`  - ID: ${suggestion.id}`);
        console.log(`  - Original text: "${suggestion.originalText}"`);
        console.log(`  - Start position: ${suggestion.startPos}`);
        console.log(`  - End position: ${suggestion.endPos}`);
        console.log(`  - Text length: ${suggestion.originalText.length}`);
        console.log(`  - Position range: ${suggestion.endPos - suggestion.startPos}`);
        console.log(`  - Content length: ${contentLength}`);
        
        // Basic bounds checking
        const isWithinBounds = suggestion.startPos >= 0 && 
                              suggestion.endPos <= contentLength && 
                              suggestion.startPos < suggestion.endPos;
        
        if (!isWithinBounds) {
          console.error(`❌ CITATION ${index + 1} OUT OF BOUNDS:`);
          console.error(`  - Start: ${suggestion.startPos} (valid: >= 0)`);
          console.error(`  - End: ${suggestion.endPos} (valid: <= ${contentLength})`);
          console.error(`  - Range valid: ${suggestion.startPos < suggestion.endPos}`);
          return; // Skip this citation
        }
        
        // Length consistency checking
        const expectedLength = suggestion.originalText.length;
        const calculatedLength = suggestion.endPos - suggestion.startPos;
        
        if (expectedLength !== calculatedLength) {
          console.warn(`⚠️ CITATION ${index + 1} LENGTH MISMATCH:`);
          console.warn(`  - Expected: ${expectedLength}`);
          console.warn(`  - Calculated: ${calculatedLength}`);
          console.warn(`  - Difference: ${Math.abs(expectedLength - calculatedLength)}`);
        }
        
        // CRITICAL: Text content validation
        const actualText = originalContent.substring(suggestion.startPos, suggestion.endPos);
        console.log(`🔍 TEXT VALIDATION:`);
        console.log(`  - Expected: "${suggestion.originalText}"`);
        console.log(`  - Actual: "${actualText}"`);
        console.log(`  - Match: ${actualText === suggestion.originalText}`);
        
        if (actualText === suggestion.originalText) {
          console.log(`✅ CITATION ${index + 1} VALIDATION PASSED`);
          validSuggestions.push(suggestion);
        } else {
          console.error(`❌ CITATION ${index + 1} TEXT MISMATCH:`);
          console.error(`  - This citation will be filtered out to prevent highlighting errors`);
          
          // Try to find the citation in nearby positions (fuzzy matching)
          const searchRadius = 50;
          const searchStart = Math.max(0, suggestion.startPos - searchRadius);
          const searchEnd = Math.min(contentLength, suggestion.endPos + searchRadius);
          const searchArea = originalContent.substring(searchStart, searchEnd);
          const foundIndex = searchArea.indexOf(suggestion.originalText);
          
          if (foundIndex !== -1) {
            const correctedStart = searchStart + foundIndex;
            const correctedEnd = correctedStart + suggestion.originalText.length;
            console.log(`🔧 FOUND CITATION IN NEARBY POSITION:`);
            console.log(`  - Corrected start: ${correctedStart} (was ${suggestion.startPos})`);
            console.log(`  - Corrected end: ${correctedEnd} (was ${suggestion.endPos})`);
            console.log(`  - Offset: ${correctedStart - suggestion.startPos}`);
            
            // Create corrected suggestion
            const correctedSuggestion = {
              ...suggestion,
              startPos: correctedStart,
              endPos: correctedEnd
            };
            
            validSuggestions.push(correctedSuggestion);
            console.log(`✅ CITATION ${index + 1} CORRECTED AND VALIDATED`);
          } else {
            console.error(`❌ CITATION ${index + 1} NOT FOUND IN NEARBY POSITIONS - DISCARDING`);
          }
        }
      });
      
      suggestions = validSuggestions;
      console.log(`\n📊 CITATION VALIDATION SUMMARY:`);
      console.log(`  - Original citations: ${originalSuggestionsCount}`);
      console.log(`  - Valid citations: ${validSuggestions.length}`);
      console.log(`  - Filtered out: ${originalSuggestionsCount - validSuggestions.length}`);
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
        contentSource: 'traced-from-pipeline',
        positionValidationEnhanced: true,
        validationTimestamp: Date.now()
      }
    };
    
    console.log(`✅ CREATED TERMINAL DATA FOR ${terminalModule.nodeId}:`, {
      moduleType: moduleData.moduleType,
      contentLength: moduleData.originalContent.length,
      suggestionsCount: moduleData.suggestions.length,
      suggestionTypes: moduleData.suggestions.map(s => s.type),
      contentPreview: moduleData.originalContent.substring(0, 100) + '...',
      allPositionsValid: moduleData.suggestions.every(s => 
        s.startPos >= 0 && s.endPos <= moduleData.originalContent.length && s.startPos < s.endPos
      )
    });
    
    terminalData.push(moduleData);
  });
  
  console.log(`\n📊 TERMINAL DATA COLLECTION SUMMARY (ENHANCED):`, {
    totalModules: terminalData.length,
    contentLengths: terminalData.map(d => d.originalContent.length),
    totalSuggestions: terminalData.reduce((sum, d) => sum + d.suggestions.length, 0),
    allSuggestionsValid: terminalData.every(module => 
      module.suggestions.every(s => 
        s.startPos >= 0 && s.endPos <= module.originalContent.length && s.startPos < s.endPos
      )
    )
  });
  
  return terminalData;
};
