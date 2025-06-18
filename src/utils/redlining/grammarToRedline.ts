
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

  // Extract the clean original content
  const originalContent = extractOriginalContent(grammarResult, originalDocument);
  console.log('Extracted original content length:', originalContent.length);
  console.log('Original content preview:', originalContent.substring(0, 200) + '...');

  // Extract suggestions from grammar analysis
  try {
    if (grammarResult.output?.analysis && Array.isArray(grammarResult.output.analysis)) {
      grammarResult.output.analysis.forEach((paragraph: any, paragraphIndex: number) => {
        if (paragraph.suggestions && Array.isArray(paragraph.suggestions)) {
          paragraph.suggestions.forEach((suggestion: any, index: number) => {
            // Create a unique ID for each suggestion
            const suggestionId = `${paragraph.paragraphId || paragraphIndex}-${index}`;
            
            // Calculate positions within the original content
            const positions = calculateSuggestionPositions(
              suggestion,
              paragraph,
              originalContent,
              paragraphIndex
            );
            
            suggestions.push({
              id: suggestionId,
              type: suggestion.type || 'grammar',
              severity: suggestion.severity || 'medium',
              originalText: suggestion.originalText || suggestion.issue || '',
              suggestedText: suggestion.suggestedText || suggestion.suggestion || '',
              explanation: suggestion.explanation || suggestion.description || 'No explanation provided',
              startPos: positions.start,
              endPos: positions.end,
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
    originalContent: originalContent,
    currentContent: originalContent,
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

/**
 * Extracts the original document content from various sources
 */
function extractOriginalContent(grammarResult: any, originalDocument: { content: string }): string {
  console.log('Extracting original content from multiple sources');
  
  // Priority 1: Original document content
  if (originalDocument.content && originalDocument.content.trim().length > 0) {
    console.log('Using original document content');
    return originalDocument.content.trim();
  }
  
  // Priority 2: Metadata original content
  if (grammarResult.metadata?.originalContent) {
    console.log('Using metadata original content');
    return grammarResult.metadata.originalContent.trim();
  }
  
  // Priority 3: Input content
  if (grammarResult.input?.content) {
    console.log('Using input content');
    return grammarResult.input.content.trim();
  }
  
  // Priority 4: Extract from analysis paragraphs
  if (grammarResult.output?.analysis && Array.isArray(grammarResult.output.analysis)) {
    console.log('Reconstructing content from analysis paragraphs');
    const reconstructedContent = grammarResult.output.analysis
      .map((para: any) => para.originalContent || para.original || '')
      .filter((content: string) => content.trim().length > 0)
      .join('\n\n');
    
    if (reconstructedContent.trim().length > 0) {
      return reconstructedContent.trim();
    }
  }
  
  console.warn('Could not extract meaningful original content');
  return 'Original document content could not be retrieved';
}

/**
 * Calculates accurate positions for suggestions within the original content
 */
function calculateSuggestionPositions(
  suggestion: any,
  paragraph: any,
  originalContent: string,
  paragraphIndex: number
): { start: number; end: number } {
  const originalText = suggestion.originalText || suggestion.issue || '';
  
  if (!originalText || originalText.trim().length === 0) {
    console.warn('No original text for suggestion, using default positions');
    return { start: 0, end: 0 };
  }
  
  // Try to find the text in the original content
  const searchText = originalText.trim();
  let startPos = originalContent.indexOf(searchText);
  
  // If not found, try partial matches or case-insensitive search
  if (startPos === -1) {
    startPos = originalContent.toLowerCase().indexOf(searchText.toLowerCase());
  }
  
  // If still not found, estimate position based on paragraph
  if (startPos === -1) {
    console.warn(`Could not find text "${searchText}" in original content`);
    // Estimate position based on paragraph index
    const paragraphs = originalContent.split('\n\n');
    let estimatedStart = 0;
    for (let i = 0; i < Math.min(paragraphIndex, paragraphs.length); i++) {
      estimatedStart += paragraphs[i].length + 2; // +2 for the double newline
    }
    startPos = estimatedStart;
  }
  
  const endPos = startPos + searchText.length;
  
  console.log(`Positioned suggestion "${searchText.substring(0, 30)}..." at ${startPos}-${endPos}`);
  
  return {
    start: startPos,
    end: endPos
  };
}

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
