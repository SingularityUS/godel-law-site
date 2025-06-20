/**
 * Terminal Data Collector
 * 
 * Purpose: Collects data from terminal modules with correct content sourcing and enhanced position validation
 */

import { extractGrammarSuggestions } from "./extractors/grammarExtractor";
import { extractCitationSuggestions } from "./extractors/citationExtractor";
import { extractCitationVerificationData, mergeCitationVerificationData } from "./extractors/citationVerifierExtractor";
import { extractOriginalContent } from "./extractors/contentExtractor";
import { RedlineSuggestion } from "@/types/redlining";

export interface TerminalModuleData {
  moduleType: string;
  nodeId: string;
  originalContent: string;
  suggestions: RedlineSuggestion[];
  metadata: any;
}

/**
 * Normalize text for comparison by trimming whitespace and normalizing line endings
 */
const normalizeText = (text: string): string => {
  return text.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
};

/**
 * Check if two texts are similar enough (allowing for minor whitespace differences)
 */
const areTextsCompatible = (expected: string, actual: string): boolean => {
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);
  
  // Exact match after normalization
  if (normalizedExpected === normalizedActual) {
    return true;
  }
  
  // Check if one contains the other (for cases where content has extra spaces)
  if (normalizedExpected.includes(normalizedActual) || normalizedActual.includes(normalizedExpected)) {
    return true;
  }
  
  // Check similarity ratio for minor differences
  const similarity = calculateSimilarity(normalizedExpected, normalizedActual);
  return similarity > 0.8; // 80% similarity threshold
};

/**
 * Calculate text similarity ratio
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i] + 1, // deletion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

export const collectTerminalData = (
  pipelineOutput: any,
  terminalModules: Array<{ moduleType: string; nodeId: string }>
): TerminalModuleData[] => {
  console.log('=== COLLECTING TERMINAL DATA (FORGIVING VALIDATION + VERIFICATION) ===');
  console.log('Terminal modules to process:', terminalModules);
  
  const terminalData: TerminalModuleData[] = [];
  
  // Get pipeline results
  const pipelineResults = pipelineOutput.pipelineResults || pipelineOutput.results || [];
  console.log(`Found ${pipelineResults.length} pipeline results`);
  
  // First pass: collect citation and verification data
  let citationSuggestions: RedlineSuggestion[] = [];
  let verificationResults: any[] = [];
  let verificationStats: any = null;
  
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
      console.log('🎯 PROCESSING CITATION FINDER MODULE WITH FORGIVING VALIDATION');
      suggestions = extractCitationSuggestions(moduleResult.result, terminalModule.nodeId);
      console.log(`Extracted ${suggestions.length} citation suggestions`);
      
      // Store citation suggestions for potential verification merging
      citationSuggestions = [...citationSuggestions, ...suggestions];
      
      // Apply forgiving validation logic (existing code)
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
          console.error(`❌ CITATION ${index + 1} OUT OF BOUNDS - DISCARDING:`);
          console.error(`  - Start: ${suggestion.startPos} (valid: >= 0)`);
          console.error(`  - End: ${suggestion.endPos} (valid: <= ${contentLength})`);
          console.error(`  - Range valid: ${suggestion.startPos < suggestion.endPos}`);
          return; // Skip this citation - bounds check must be strict
        }
        
        // Length consistency checking (WARNING only - not blocking)
        const expectedLength = suggestion.originalText.length;
        const calculatedLength = suggestion.endPos - suggestion.startPos;
        
        if (expectedLength !== calculatedLength) {
          console.warn(`⚠️ CITATION ${index + 1} LENGTH MISMATCH (non-blocking):`);
          console.warn(`  - Expected: ${expectedLength}`);
          console.warn(`  - Calculated: ${calculatedLength}`);
          console.warn(`  - Difference: ${Math.abs(expectedLength - calculatedLength)}`);
        }
        
        // FORGIVING: Text content validation with similarity matching
        const actualText = originalContent.substring(suggestion.startPos, suggestion.endPos);
        console.log(`🔍 TEXT VALIDATION (FORGIVING):`);
        console.log(`  - Expected: "${suggestion.originalText}"`);
        console.log(`  - Actual: "${actualText}"`);
        
        const textsAreCompatible = areTextsCompatible(suggestion.originalText, actualText);
        console.log(`  - Compatible: ${textsAreCompatible}`);
        
        if (textsAreCompatible) {
          console.log(`✅ CITATION ${index + 1} VALIDATION PASSED (compatible text)`);
          validSuggestions.push(suggestion);
        } else {
          // FORGIVING: Try to find the citation in nearby positions (fuzzy matching)
          console.log(`🔧 ATTEMPTING POSITION CORRECTION FOR CITATION ${index + 1}`);
          const searchRadius = 100; // Increased search radius
          const searchStart = Math.max(0, suggestion.startPos - searchRadius);
          const searchEnd = Math.min(contentLength, suggestion.endPos + searchRadius);
          const searchArea = originalContent.substring(searchStart, searchEnd);
          
          // Try exact match first
          let foundIndex = searchArea.indexOf(suggestion.originalText);
          
          // If exact match fails, try normalized matching
          if (foundIndex === -1) {
            const normalizedTarget = normalizeText(suggestion.originalText);
            const words = normalizedTarget.split(' ');
            
            // Try to find the first few words of the citation
            if (words.length > 2) {
              const partialTarget = words.slice(0, Math.min(3, words.length)).join(' ');
              foundIndex = searchArea.indexOf(partialTarget);
              console.log(`  - Partial match attempt: "${partialTarget}" found at ${foundIndex}`);
            }
          }
          
          if (foundIndex !== -1) {
            const correctedStart = searchStart + foundIndex;
            const correctedEnd = correctedStart + suggestion.originalText.length;
            
            // Verify corrected position is within bounds
            if (correctedStart >= 0 && correctedEnd <= contentLength) {
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
              console.log(`✅ CITATION ${index + 1} CORRECTED AND ACCEPTED`);
            } else {
              console.warn(`⚠️ CORRECTED POSITION OUT OF BOUNDS - ACCEPTING ORIGINAL (forgiving mode)`);
              validSuggestions.push(suggestion); // Accept anyway in forgiving mode
            }
          } else {
            console.warn(`⚠️ CITATION ${index + 1} NOT FOUND NEARBY - ACCEPTING ANYWAY (forgiving mode)`);
            validSuggestions.push(suggestion); // Accept anyway in forgiving mode
          }
        }
      });
      
      suggestions = validSuggestions;
      console.log(`\n📊 CITATION VALIDATION SUMMARY (FORGIVING):`);
      console.log(`  - Original citations: ${originalSuggestionsCount}`);
      console.log(`  - Valid citations: ${validSuggestions.length}`);
      console.log(`  - Filtered out: ${originalSuggestionsCount - validSuggestions.length}`);
      console.log(`  - Acceptance rate: ${((validSuggestions.length / originalSuggestionsCount) * 100).toFixed(1)}%`);
    } else if (terminalModule.moduleType === 'citation-verifier') {
      console.log('🎯 PROCESSING CITATION VERIFIER MODULE');
      const extractedData = extractCitationVerificationData(moduleResult.result, terminalModule.nodeId);
      verificationResults = extractedData.verificationResults;
      verificationStats = extractedData.verificationStats;
      console.log(`Extracted ${verificationResults.length} verification results`);
      
      // Don't create separate suggestions for verifier - it will be merged with citations
      suggestions = [];
    } else {
      console.log(`Unknown terminal module type: ${terminalModule.moduleType}`);
    }
    
    if (suggestions.length > 0) {
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
          positionValidationMode: 'forgiving',
          validationTimestamp: Date.now()
        }
      };
      
      terminalData.push(moduleData);
    }
  });
  
  // Second pass: merge verification data with citation suggestions
  if (verificationResults.length > 0 && citationSuggestions.length > 0) {
    console.log(`\n🔗 MERGING VERIFICATION DATA WITH CITATIONS`);
    console.log(`Found ${verificationResults.length} verification results for ${citationSuggestions.length} citations`);
    
    // Find citation terminal data and merge verification
    terminalData.forEach(moduleData => {
      if (moduleData.moduleType === 'citation-finder') {
        console.log(`Merging verification data for citation finder module ${moduleData.nodeId}`);
        moduleData.suggestions = mergeCitationVerificationData(moduleData.suggestions, verificationResults);
        
        // Add verification stats to metadata
        moduleData.metadata.verificationStats = verificationStats;
        moduleData.metadata.verificationMerged = true;
        
        console.log(`✅ Merged verification data: ${moduleData.suggestions.filter(s => s.verificationStatus).length} citations have verification status`);
      }
    });
  }
  
  terminalData.forEach(moduleData => {
    console.log(`✅ CREATED TERMINAL DATA FOR ${moduleData.nodeId}:`, {
      moduleType: moduleData.moduleType,
      contentLength: moduleData.originalContent.length,
      suggestionsCount: moduleData.suggestions.length,
      suggestionTypes: moduleData.suggestions.map(s => s.type),
      contentPreview: moduleData.originalContent.substring(0, 100) + '...',
      basicPositionValidation: moduleData.suggestions.every(s => 
        s.startPos >= 0 && s.endPos <= moduleData.originalContent.length && s.startPos < s.endPos
      ),
      hasVerificationData: moduleData.suggestions.some(s => s.verificationStatus)
    });
  });
  
  console.log(`\n📊 TERMINAL DATA COLLECTION SUMMARY (FORGIVING + VERIFICATION):`, {
    totalModules: terminalData.length,
    contentLengths: terminalData.map(d => d.originalContent.length),
    totalSuggestions: terminalData.reduce((sum, d) => sum + d.suggestions.length, 0),
    citationsWithVerification: terminalData.reduce((sum, d) => 
      sum + d.suggestions.filter(s => s.verificationStatus).length, 0
    ),
    basicValidationPassed: terminalData.every(module => 
      module.suggestions.every(s => 
        s.startPos >= 0 && s.endPos <= module.originalContent.length && s.startPos < s.endPos
      )
    ),
    validationMode: 'forgiving - allows minor text differences + citation verification'
  });
  
  return terminalData;
};
