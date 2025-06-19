
/**
 * Citation Data Extractor
 * 
 * Purpose: Extracts citation suggestions from citation module output
 */

import { RedlineSuggestion } from "@/types/redlining";

/**
 * Extract citation suggestions from module result
 */
export const extractCitationSuggestions = (
  moduleResult: any,
  sourceId: string
): RedlineSuggestion[] => {
  console.log('=== EXTRACTING CITATION SUGGESTIONS ===');
  
  const suggestions: RedlineSuggestion[] = [];
  
  // Find citation data
  const citationData = moduleResult.citations || 
                      moduleResult.output?.citations ||
                      moduleResult.result?.citations;
  
  if (!citationData || !Array.isArray(citationData)) {
    console.warn('No citation data found');
    return suggestions;
  }
  
  console.log(`Processing ${citationData.length} citations`);
  
  citationData.forEach((citation: any, index: number) => {
    const redlineSuggestion: RedlineSuggestion = {
      id: `${sourceId}-citation-${index}`,
      type: 'legal',
      severity: 'medium',
      originalText: citation.text || citation.citation || '',
      suggestedText: citation.text || citation.citation || '',
      explanation: `Legal citation: ${citation.case || citation.title || 'Citation found'}`,
      startPos: citation.startPos || 0,
      endPos: citation.endPos || (citation.text?.length || 0),
      paragraphId: citation.paragraphId || `citation-${index}`,
      status: 'pending',
      confidence: citation.confidence || 0.9
    };
    
    suggestions.push(redlineSuggestion);
  });
  
  console.log(`Extracted ${suggestions.length} citation suggestions`);
  return suggestions;
};
