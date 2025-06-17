
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
  const suggestions: RedlineSuggestion[] = [];
  
  // Extract suggestions from grammar analysis
  if (grammarResult.output?.analysis) {
    grammarResult.output.analysis.forEach((paragraph: any) => {
      if (paragraph.suggestions) {
        paragraph.suggestions.forEach((suggestion: any, index: number) => {
          suggestions.push({
            id: `${paragraph.paragraphId}-${index}`,
            type: suggestion.type || 'grammar',
            severity: suggestion.severity || 'medium',
            originalText: suggestion.originalText || '',
            suggestedText: suggestion.suggestedText || '',
            explanation: suggestion.explanation || '',
            startPos: suggestion.position?.start || 0,
            endPos: suggestion.position?.end || 0,
            paragraphId: paragraph.paragraphId,
            status: 'pending',
            confidence: suggestion.confidence
          });
        });
      }
    });
  }

  return {
    id: `redline-${Date.now()}`,
    originalContent: originalDocument.content,
    currentContent: originalDocument.content,
    suggestions,
    metadata: {
      fileName: originalDocument.name,
      fileType: originalDocument.type,
      lastModified: new Date().toISOString(),
      totalSuggestions: suggestions.length,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0
    },
    positionMap: grammarResult.metadata?.originalPositionMap
  };
};
