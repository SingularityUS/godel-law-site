
/**
 * Grammar Transformation Utilities
 * 
 * Purpose: Direct grammar analysis to redline conversion without React hook dependencies
 */

import { RedlineSuggestion } from "@/types/redlining";

export interface GrammarAnalysisItem {
  paragraphId?: string;
  suggestions?: any[];
  issues?: any[];
  corrections?: any[];
}

/**
 * Convert grammar analysis data directly to redline suggestions
 */
export const convertGrammarDataToRedlineSuggestions = (
  grammarResult: any, 
  sourceId: string
): RedlineSuggestion[] => {
  console.log('=== DIRECT GRAMMAR CONVERSION START ===');
  console.log('Grammar result structure:', {
    hasOutput: !!grammarResult?.output,
    hasAnalysis: !!grammarResult?.output?.analysis,
    hasFinalOutput: !!grammarResult?.finalOutput,
    analysisLength: grammarResult?.output?.analysis?.length || 0,
    resultKeys: Object.keys(grammarResult || {})
  });

  const suggestions: RedlineSuggestion[] = [];
  
  try {
    // Extract analysis data from multiple possible paths
    let analysisData = extractAnalysisData(grammarResult);
    
    if (!analysisData || !Array.isArray(analysisData) || analysisData.length === 0) {
      console.warn('No valid analysis data found for grammar conversion');
      return [];
    }

    console.log(`Processing ${analysisData.length} analysis items`);

    // Process each paragraph/analysis item
    analysisData.forEach((item: GrammarAnalysisItem, index: number) => {
      console.log(`Processing analysis item ${index}:`, item);
      
      // Extract suggestions from various possible properties
      const itemSuggestions = extractSuggestionsFromItem(item);
      
      itemSuggestions.forEach((suggestion: any, suggestionIndex: number) => {
        const redlineSuggestion = createRedlineSuggestion(
          suggestion,
          item,
          index,
          suggestionIndex,
          sourceId
        );
        
        if (redlineSuggestion) {
          suggestions.push(redlineSuggestion);
        }
      });
    });

    console.log(`Created ${suggestions.length} redline suggestions from grammar data`);
    return suggestions;

  } catch (error) {
    console.error('Error in direct grammar conversion:', error);
    return [];
  }
};

/**
 * Extract analysis data from grammar result
 */
function extractAnalysisData(grammarResult: any): any[] | null {
  const paths = [
    grammarResult?.output?.analysis,
    grammarResult?.finalOutput?.output?.analysis,
    grammarResult?.finalOutput?.finalOutput?.output?.analysis,
    grammarResult?.analysis,
    grammarResult?.result?.output?.analysis,
    grammarResult?.result?.analysis
  ];
  
  for (const path of paths) {
    if (path && Array.isArray(path) && path.length > 0) {
      console.log(`Found analysis data at path with ${path.length} items`);
      return path;
    }
  }
  
  return null;
}

/**
 * Extract suggestions from analysis item
 */
function extractSuggestionsFromItem(item: GrammarAnalysisItem): any[] {
  if (item.suggestions && Array.isArray(item.suggestions)) {
    return item.suggestions;
  } else if (item.issues && Array.isArray(item.issues)) {
    return item.issues;
  } else if (item.corrections && Array.isArray(item.corrections)) {
    return item.corrections;
  }
  
  return [];
}

/**
 * Create a redline suggestion from grammar suggestion data
 */
function createRedlineSuggestion(
  suggestion: any,
  item: GrammarAnalysisItem,
  itemIndex: number,
  suggestionIndex: number,
  sourceId: string
): RedlineSuggestion | null {
  const originalText = suggestion.originalText || 
                      suggestion.issue || 
                      suggestion.text || 
                      suggestion.original || '';

  const suggestedText = suggestion.suggestedText || 
                       suggestion.suggestion || 
                       suggestion.correction || 
                       suggestion.replacement || '';

  if (!originalText) {
    console.warn('No original text found in suggestion, skipping');
    return null;
  }

  return {
    id: `${sourceId}-${itemIndex}-${suggestionIndex}`,
    type: (suggestion.type || suggestion.category || 'grammar') as 'grammar' | 'style' | 'legal' | 'clarity',
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
    status: 'pending' as const,
    confidence: suggestion.confidence || suggestion.score || 0.8
  };
}
