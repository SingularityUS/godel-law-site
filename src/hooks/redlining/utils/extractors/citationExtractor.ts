
/**
 * Citation Data Extractor
 * 
 * Purpose: Extracts citation suggestions from citation module output
 */

import { RedlineSuggestion } from "@/types/redlining";
import { CitationFinding } from "@/hooks/workbench/utils/moduleProcessors/citationFinderProcessor";

/**
 * Extract citation suggestions from module result
 */
export const extractCitationSuggestions = (
  moduleResult: any,
  sourceId: string
): RedlineSuggestion[] => {
  console.log('=== EXTRACTING CITATION SUGGESTIONS (ENHANCED DEBUG) ===');
  console.log('Module result structure:', {
    hasOutput: !!moduleResult.output,
    hasResult: !!moduleResult.result,
    hasDirectCitations: !!moduleResult.citations,
    keys: Object.keys(moduleResult || {})
  });
  
  const suggestions: RedlineSuggestion[] = [];
  
  // Find citation data - Updated to match citation finder structure
  let citationData: CitationFinding[] | null = null;
  
  // Check the correct citation finder output structure
  if (moduleResult.output?.citations && Array.isArray(moduleResult.output.citations)) {
    citationData = moduleResult.output.citations;
    console.log('Found citations in moduleResult.output.citations:', citationData.length);
  } else if (moduleResult.result?.output?.citations && Array.isArray(moduleResult.result.output.citations)) {
    citationData = moduleResult.result.output.citations;
    console.log('Found citations in moduleResult.result.output.citations:', citationData.length);
  } else if (moduleResult.citations && Array.isArray(moduleResult.citations)) {
    citationData = moduleResult.citations;
    console.log('Found citations in moduleResult.citations:', citationData.length);
  }
  
  if (!citationData || !Array.isArray(citationData)) {
    console.warn('No citation data found or data is not an array');
    return suggestions;
  }
  
  console.log(`🔍 CITATION POSITION DEBUG: Processing ${citationData.length} citation findings`);
  
  citationData.forEach((citation: CitationFinding, index: number) => {
    console.log(`📍 CITATION ${index + 1} POSITION ANALYSIS:`, {
      id: citation.id,
      type: citation.type,
      originalText: citation.originalText,
      originalTextLength: citation.originalText?.length || 0,
      startPos: citation.startPos,
      endPos: citation.endPos,
      positionRange: citation.endPos - citation.startPos,
      textLengthVsRange: (citation.originalText?.length || 0) === (citation.endPos - citation.startPos),
      isComplete: citation.isComplete,
      needsVerification: citation.needsVerification
    });

    // Validate position bounds - CRITICAL DEBUG
    const hasValidPositions = typeof citation.startPos === 'number' && 
                             typeof citation.endPos === 'number' && 
                             citation.startPos >= 0 && 
                             citation.endPos > citation.startPos;

    if (!hasValidPositions) {
      console.error(`❌ CITATION ${index + 1} INVALID POSITIONS:`, {
        startPos: citation.startPos,
        endPos: citation.endPos,
        startPosType: typeof citation.startPos,
        endPosType: typeof citation.endPos
      });
      return; // Skip this citation
    }

    // Validate text length matches position range
    const expectedLength = citation.endPos - citation.startPos;
    const actualLength = citation.originalText?.length || 0;
    
    if (expectedLength !== actualLength) {
      console.warn(`⚠️ CITATION ${index + 1} LENGTH MISMATCH:`, {
        expectedLength,
        actualLength,
        difference: expectedLength - actualLength,
        text: citation.originalText
      });
    }

    // Determine severity based on citation completeness and verification needs
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (citation.needsVerification) {
      severity = 'medium';
    }
    if (!citation.isComplete) {
      severity = 'high';
    }
    
    // Create explanation based on citation type and status
    let explanation = `Bluebook citation detected: ${citation.type}`;
    if (citation.bluebookFormat && citation.bluebookFormat !== citation.originalText) {
      explanation += ` (Suggested format: ${citation.bluebookFormat})`;
    }
    if (citation.needsVerification) {
      explanation += ' - Requires verification';
    }
    if (!citation.isComplete) {
      explanation += ' - Incomplete citation';
    }
    
    // For complete citations, suggest the properly formatted version
    // For incomplete citations, suggest completion
    let suggestedText = citation.originalText;
    if (citation.bluebookFormat && citation.bluebookFormat !== citation.originalText) {
      suggestedText = citation.bluebookFormat;
    }

    const redlineSuggestion: RedlineSuggestion = {
      id: `${sourceId}-citation-${index}`,
      type: 'legal',
      severity: severity,
      originalText: citation.originalText || '',
      suggestedText: suggestedText || citation.originalText || '',
      explanation: explanation,
      startPos: citation.startPos,
      endPos: citation.endPos,
      paragraphId: citation.paragraphId || `citation-${index}`,
      status: 'pending',
      confidence: citation.isComplete ? 0.9 : 0.7
    };
    
    console.log(`✅ CREATED REDLINE SUGGESTION ${index + 1}:`, {
      id: redlineSuggestion.id,
      type: redlineSuggestion.type,
      severity: redlineSuggestion.severity,
      startPos: redlineSuggestion.startPos,
      endPos: redlineSuggestion.endPos,
      positionRange: redlineSuggestion.endPos - redlineSuggestion.startPos,
      originalTextLength: redlineSuggestion.originalText.length,
      textPreview: redlineSuggestion.originalText.substring(0, 30) + '...'
    });
    
    suggestions.push(redlineSuggestion);
  });
  
  console.log(`📊 CITATION EXTRACTION SUMMARY:`, {
    totalCitations: citationData.length,
    extractedSuggestions: suggestions.length,
    positionRanges: suggestions.map(s => `${s.startPos}-${s.endPos}`),
    textLengths: suggestions.map(s => s.originalText.length)
  });
  
  return suggestions;
};
