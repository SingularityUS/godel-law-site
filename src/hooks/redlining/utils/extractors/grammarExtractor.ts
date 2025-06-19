
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
  console.log('=== EXTRACTING GRAMMAR SUGGESTIONS (Enhanced for Position Mapping) ===');
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
          suggestionsCount: item.suggestions?.length || 0,
          itemKeys: Object.keys(item || {})
        });
        
        // Log the actual suggestions array structure
        if (item.suggestions && Array.isArray(item.suggestions)) {
          console.log(`Found ${item.suggestions.length} suggestions in item ${itemIndex}:`, 
            item.suggestions.map((s: any, idx: number) => ({
              index: idx,
              type: s.type,
              originalText: s.originalText?.substring(0, 50) + '...',
              suggestedText: s.suggestedText?.substring(0, 50) + '...',
              hasPosition: !!s.position,
              positionStart: s.position?.start,
              positionEnd: s.position?.end,
              hasStartPos: s.startPos !== undefined,
              hasEndPos: s.endPos !== undefined
            }))
          );
        }
        
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
              console.log(`✅ Created redline suggestion ${suggestions.length}:`, {
                id: redlineSuggestion.id,
                type: redlineSuggestion.type,
                startPos: redlineSuggestion.startPos,
                endPos: redlineSuggestion.endPos,
                originalTextPreview: redlineSuggestion.originalText.substring(0, 30) + '...'
              });
            }
          } catch (error) {
            console.error(`Error creating redline suggestion ${suggestionIndex} for item ${itemIndex}:`, error);
          }
        });
      } catch (error) {
        console.error(`Error processing analysis item ${itemIndex}:`, error);
      }
    });
    
    console.log(`✅ EXTRACTION COMPLETE: Created ${suggestions.length} grammar suggestions`);
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
 * Extract suggestions from an analysis item with improved detection
 */
function extractSuggestionsFromItem(item: any): any[] {
  console.log('Extracting suggestions from item:', {
    hasSuggestions: !!item.suggestions,
    suggestionsType: Array.isArray(item.suggestions) ? 'array' : typeof item.suggestions,
    suggestionsLength: item.suggestions?.length || 0
  });

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
      console.log(`Found ${source.length} suggestions in source`);
      return source;
    }
  }
  
  // If no array found, check if the item itself is a suggestion
  if (item.originalText || item.issue || item.text) {
    console.log('Treating item itself as suggestion');
    return [item];
  }
  
  console.log('No suggestions found in item');
  return [];
}

/**
 * Create a redline suggestion from grammar data with improved position handling
 */
function createRedlineSuggestion(
  suggestion: any,
  item: any,
  itemIndex: number,
  suggestionIndex: number,
  sourceId: string
): RedlineSuggestion | null {
  console.log(`Creating redline suggestion ${suggestionIndex} for item ${itemIndex}:`, {
    hasOriginalText: !!suggestion.originalText,
    hasSuggestedText: !!suggestion.suggestedText,
    hasPosition: !!suggestion.position,
    hasStartPos: suggestion.startPos !== undefined,
    hasEndPos: suggestion.endPos !== undefined,
    suggestionKeys: Object.keys(suggestion || {})
  });

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

  // Enhanced position handling - support both formats
  let startPos = 0;
  let endPos = originalText.length;

  // Try position object first (your data format)
  if (suggestion.position && typeof suggestion.position === 'object') {
    if (typeof suggestion.position.start === 'number') {
      startPos = suggestion.position.start;
    }
    if (typeof suggestion.position.end === 'number') {
      endPos = suggestion.position.end;
    }
    console.log(`Using position object: start=${startPos}, end=${endPos}`);
  }
  // Fallback to direct properties
  else if (suggestion.startPos !== undefined || suggestion.endPos !== undefined) {
    startPos = suggestion.startPos || 0;
    endPos = suggestion.endPos || originalText.length;
    console.log(`Using direct position properties: start=${startPos}, end=${endPos}`);
  }
  // If no position info, try to estimate
  else {
    console.log('No position info found, using text length for end position');
    endPos = originalText.length;
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

  const redlineSuggestion: RedlineSuggestion = {
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
    startPos,
    endPos,
    paragraphId: item.paragraphId || item.id || `paragraph-${itemIndex}`,
    status: 'pending' as const,
    confidence: suggestion.confidence || suggestion.score || 0.8
  };

  console.log(`✅ Created redline suggestion:`, {
    id: redlineSuggestion.id,
    type: redlineSuggestion.type,
    positions: `${redlineSuggestion.startPos}-${redlineSuggestion.endPos}`,
    originalPreview: redlineSuggestion.originalText.substring(0, 30) + '...',
    suggestedPreview: redlineSuggestion.suggestedText.substring(0, 30) + '...'
  });

  return redlineSuggestion;
}
