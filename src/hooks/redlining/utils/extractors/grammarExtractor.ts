
/**
 * Grammar Data Extractor
 * 
 * Purpose: Extracts grammar suggestions from grammar analysis module output with enhanced parsing
 */

import { RedlineSuggestion } from "@/types/redlining";

/**
 * Extract grammar suggestions from module result with enhanced error handling
 */
export const extractGrammarSuggestions = (
  moduleResult: any,
  sourceId: string
): RedlineSuggestion[] => {
  console.log('=== EXTRACTING GRAMMAR SUGGESTIONS (Enhanced) ===');
  console.log('Module result structure:', {
    hasOutput: !!moduleResult.output,
    hasAnalysis: !!moduleResult.output?.analysis,
    analysisLength: moduleResult.output?.analysis?.length || 0,
    hasFinalOutput: !!moduleResult.finalOutput,
    hasDirectAnalysis: !!moduleResult.analysis,
    resultKeys: Object.keys(moduleResult || {})
  });
  
  const suggestions: RedlineSuggestion[] = [];
  
  try {
    // Find analysis data with multiple fallback paths
    const analysisData = findAnalysisData(moduleResult);
    
    if (!analysisData || !Array.isArray(analysisData)) {
      console.warn('No valid grammar analysis data found');
      return suggestions;
    }
    
    console.log(`Processing ${analysisData.length} analysis items`);
    
    analysisData.forEach((item: any, itemIndex: number) => {
      try {
        console.log(`Processing analysis item ${itemIndex}:`, {
          hasContent: !!item.content,
          hasSuggestions: !!item.suggestions,
          hasIssues: !!item.issues,
          hasCorrections: !!item.corrections,
          itemKeys: Object.keys(item || {})
        });
        
        const itemSuggestions = extractSuggestionsFromItem(item);
        
        itemSuggestions.forEach((suggestion: any, suggestionIndex: number) => {
          try {
            const redlineSuggestion = createRedlineSuggestion(
              suggestion,
              item,
              itemIndex,
              suggestionIndex,
              sourceId
            );
            
            if (redlineSuggestion) {
              suggestions.push(redlineSuggestion);
            }
          } catch (error) {
            console.error(`Error creating redline suggestion ${suggestionIndex} for item ${itemIndex}:`, error);
          }
        });
      } catch (error) {
        console.error(`Error processing analysis item ${itemIndex}:`, error);
      }
    });
    
    console.log(`Extracted ${suggestions.length} grammar suggestions`);
    return suggestions;
    
  } catch (error) {
    console.error('Error in grammar suggestions extraction:', error);
    return [];
  }
};

/**
 * Find analysis data from various possible locations
 */
function findAnalysisData(moduleResult: any): any[] | null {
  const analysisPaths = [
    moduleResult?.output?.analysis,
    moduleResult?.finalOutput?.output?.analysis,
    moduleResult?.finalOutput?.finalOutput?.output?.analysis,
    moduleResult?.analysis,
    moduleResult?.result?.output?.analysis,
    moduleResult?.result?.analysis
  ];
  
  for (const path of analysisPaths) {
    if (path && Array.isArray(path) && path.length > 0) {
      console.log(`Found analysis data with ${path.length} items`);
      return path;
    }
  }
  
  return null;
}

/**
 * Extract suggestions from an analysis item
 */
function extractSuggestionsFromItem(item: any): any[] {
  // Look for suggestions in various formats
  const suggestionSources = [
    item.suggestions,
    item.issues,
    item.corrections,
    item.grammarIssues,
    item.styleIssues
  ];
  
  for (const source of suggestionSources) {
    if (Array.isArray(source) && source.length > 0) {
      return source;
    }
  }
  
  // If no array found, check if the item itself is a suggestion
  if (item.originalText || item.issue || item.text) {
    return [item];
  }
  
  return [];
}

/**
 * Create a redline suggestion from grammar data
 */
function createRedlineSuggestion(
  suggestion: any,
  item: any,
  itemIndex: number,
  suggestionIndex: number,
  sourceId: string
): RedlineSuggestion | null {
  const originalText = suggestion.originalText || 
                      suggestion.issue || 
                      suggestion.text || 
                      suggestion.original || 
                      suggestion.errorText || '';

  const suggestedText = suggestion.suggestedText || 
                       suggestion.suggestion || 
                       suggestion.correction || 
                       suggestion.replacement || 
                       suggestion.correctedText || '';

  if (!originalText || typeof originalText !== 'string') {
    console.warn('No valid original text found in suggestion, skipping');
    return null;
  }

  const severityMapping: { [key: string]: 'low' | 'medium' | 'high' } = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'minor': 'low',
    'major': 'high',
    'critical': 'high'
  };

  const typeMapping: { [key: string]: 'grammar' | 'style' | 'legal' | 'clarity' } = {
    'grammar': 'grammar',
    'style': 'style',
    'legal': 'legal',
    'clarity': 'clarity',
    'spelling': 'grammar',
    'punctuation': 'grammar',
    'syntax': 'grammar'
  };

  return {
    id: `${sourceId}-grammar-${itemIndex}-${suggestionIndex}`,
    type: typeMapping[suggestion.type || suggestion.category || 'grammar'] || 'grammar',
    severity: severityMapping[suggestion.severity || suggestion.priority || 'medium'] || 'medium',
    originalText,
    suggestedText,
    explanation: suggestion.explanation || 
                suggestion.description || 
                suggestion.reason || 
                suggestion.message ||
                'Grammar improvement suggestion',
    startPos: suggestion.startPos || suggestion.start || 0,
    endPos: suggestion.endPos || suggestion.end || originalText.length,
    paragraphId: item.paragraphId || item.id || `paragraph-${itemIndex}`,
    status: 'pending' as const,
    confidence: suggestion.confidence || suggestion.score || 0.8
  };
}
