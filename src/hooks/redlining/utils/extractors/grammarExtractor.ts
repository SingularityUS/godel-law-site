
/**
 * Grammar Data Extractor
 * 
 * Purpose: Extracts grammar suggestions from grammar analysis module output
 */

import { RedlineSuggestion } from "@/types/redlining";

/**
 * Extract grammar suggestions from module result
 */
export const extractGrammarSuggestions = (
  moduleResult: any,
  sourceId: string
): RedlineSuggestion[] => {
  console.log('=== EXTRACTING GRAMMAR SUGGESTIONS ===');
  console.log('Module result structure:', {
    hasOutput: !!moduleResult.output,
    hasAnalysis: !!moduleResult.output?.analysis,
    analysisLength: moduleResult.output?.analysis?.length || 0
  });
  
  const suggestions: RedlineSuggestion[] = [];
  
  // Find analysis data
  const analysisData = moduleResult.output?.analysis || 
                      moduleResult.finalOutput?.output?.analysis ||
                      moduleResult.analysis;
  
  if (!analysisData || !Array.isArray(analysisData)) {
    console.warn('No grammar analysis data found');
    return suggestions;
  }
  
  console.log(`Processing ${analysisData.length} analysis items`);
  
  analysisData.forEach((item: any, itemIndex: number) => {
    const itemSuggestions = item.suggestions || item.issues || item.corrections || [];
    
    itemSuggestions.forEach((suggestion: any, suggestionIndex: number) => {
      const originalText = suggestion.originalText || 
                          suggestion.issue || 
                          suggestion.text || 
                          suggestion.original || '';

      const suggestedText = suggestion.suggestedText || 
                           suggestion.suggestion || 
                           suggestion.correction || 
                           suggestion.replacement || '';

      if (!originalText) {
        console.warn('Skipping suggestion with no original text');
        return;
      }

      const redlineSuggestion: RedlineSuggestion = {
        id: `${sourceId}-grammar-${itemIndex}-${suggestionIndex}`,
        type: 'grammar',
        severity: (suggestion.severity || suggestion.priority || 'medium') as 'low' | 'medium' | 'high',
        originalText,
        suggestedText,
        explanation: suggestion.explanation || 
                    suggestion.description || 
                    suggestion.reason || 
                    'Grammar improvement suggestion',
        startPos: suggestion.startPos || 0,
        endPos: suggestion.endPos || originalText.length,
        paragraphId: item.paragraphId || `paragraph-${itemIndex}`,
        status: 'pending',
        confidence: suggestion.confidence || suggestion.score || 0.8
      };
      
      suggestions.push(redlineSuggestion);
    });
  });
  
  console.log(`Extracted ${suggestions.length} grammar suggestions`);
  return suggestions;
};
