
/**
 * Grammar to Redline Converter
 * 
 * Purpose: Converts grammar analysis results to redlining format
 */

import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";

export const convertGrammarAnalysisToRedline = (
  grammarResult: any,
  originalDocument: { name: string; type: string; content: string }
): RedlineDocument => {
  console.log('Converting grammar analysis to redline format');
  console.log('Grammar result:', grammarResult);
  console.log('Original document:', originalDocument);

  const suggestions: RedlineSuggestion[] = [];
  
  // Validate input data
  if (!grammarResult || !originalDocument) {
    console.warn('Missing grammar result or original document');
    return createEmptyRedlineDocument(originalDocument);
  }

  // Extract suggestions from grammar analysis
  try {
    if (grammarResult.output?.analysis && Array.isArray(grammarResult.output.analysis)) {
      grammarResult.output.analysis.forEach((paragraph: any, paragraphIndex: number) => {
        if (paragraph.suggestions && Array.isArray(paragraph.suggestions)) {
          paragraph.suggestions.forEach((suggestion: any, index: number) => {
            // Create a unique ID for each suggestion
            const suggestionId = `${paragraph.paragraphId || paragraphIndex}-${index}`;
            
            suggestions.push({
              id: suggestionId,
              type: suggestion.type || 'grammar',
              severity: suggestion.severity || 'medium',
              originalText: suggestion.originalText || suggestion.issue || '',
              suggestedText: suggestion.suggestedText || suggestion.suggestion || '',
              explanation: suggestion.explanation || suggestion.description || 'No explanation provided',
              startPos: suggestion.position?.start || 0,
              endPos: suggestion.position?.end || 0,
              paragraphId: paragraph.paragraphId || `paragraph-${paragraphIndex}`,
              status: 'pending',
              confidence: suggestion.confidence || 0.8
            });
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing grammar analysis suggestions:', error);
  }

  console.log(`Created ${suggestions.length} suggestions for redlining`);

  return {
    id: `redline-${Date.now()}`,
    originalContent: originalDocument.content || '',
    currentContent: originalDocument.content || '',
    suggestions,
    metadata: {
      fileName: originalDocument.name || 'Untitled Document',
      fileType: originalDocument.type || 'text/plain',
      lastModified: new Date().toISOString(),
      totalSuggestions: suggestions.length,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0
    },
    positionMap: grammarResult.metadata?.originalPositionMap
  };
};

function createEmptyRedlineDocument(originalDocument: { name: string; type: string; content: string } | null): RedlineDocument {
  return {
    id: `redline-empty-${Date.now()}`,
    originalContent: originalDocument?.content || '',
    currentContent: originalDocument?.content || '',
    suggestions: [],
    metadata: {
      fileName: originalDocument?.name || 'Untitled Document',
      fileType: originalDocument?.type || 'text/plain',
      lastModified: new Date().toISOString(),
      totalSuggestions: 0,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0
    }
  };
}
