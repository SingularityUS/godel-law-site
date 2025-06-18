
/**
 * Grammar to Redline Converter
 * 
 * Purpose: Converts grammar analysis results to redlining format with controlled whitespace management
 */

import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";

export const convertGrammarAnalysisToRedline = (
  grammarResult: any,
  originalDocument: { name: string; type: string; content: string }
): RedlineDocument => {
  console.log('Converting grammar analysis to redline format with controlled whitespace management');
  console.log('Grammar result:', grammarResult);
  console.log('Original document:', originalDocument);

  const suggestions: RedlineSuggestion[] = [];
  
  // Validate input data
  if (!grammarResult || !originalDocument) {
    console.warn('Missing grammar result or original document');
    return createEmptyRedlineDocument(originalDocument);
  }

  // Extract the original content with FULL formatting preservation for redline display
  const originalContent = extractOriginalContentForDisplay(grammarResult, originalDocument);
  console.log('Extracted original content length:', originalContent.length);
  console.log('Original content preview (first 200 chars):', JSON.stringify(originalContent.substring(0, 200)));

  // Extract suggestions from grammar analysis with enhanced path handling
  try {
    let analysisData = null;
    
    // Multiple paths for analysis data
    if (grammarResult.output?.analysis && Array.isArray(grammarResult.output.analysis)) {
      analysisData = grammarResult.output.analysis;
    } else if (grammarResult.analysis && Array.isArray(grammarResult.analysis)) {
      analysisData = grammarResult.analysis;
    }

    if (analysisData && Array.isArray(analysisData)) {
      analysisData.forEach((paragraph: any, paragraphIndex: number) => {
        console.log(`Processing paragraph ${paragraphIndex}:`, paragraph);
        
        // Handle different suggestion structures
        let paragraphSuggestions = [];
        
        if (paragraph.suggestions && Array.isArray(paragraph.suggestions)) {
          paragraphSuggestions = paragraph.suggestions;
        } else if (paragraph.issues && Array.isArray(paragraph.issues)) {
          paragraphSuggestions = paragraph.issues;
        } else if (paragraph.corrections && Array.isArray(paragraph.corrections)) {
          paragraphSuggestions = paragraph.corrections;
        }

        paragraphSuggestions.forEach((suggestion: any, index: number) => {
          // Create a unique ID for each suggestion
          const suggestionId = `${paragraph.paragraphId || paragraphIndex}-${index}`;
          
          // Calculate positions within the original content using enhanced position mapping
          const positions = calculateSuggestionPositionsWithWhitespaceHandling(
            suggestion,
            paragraph,
            originalContent,
            paragraphIndex
          );
          
          // Enhanced suggestion object creation
          suggestions.push({
            id: suggestionId,
            type: suggestion.type || suggestion.category || 'grammar',
            severity: suggestion.severity || suggestion.priority || 'medium',
            originalText: suggestion.originalText || 
                         suggestion.issue || 
                         suggestion.text || 
                         suggestion.original || '',
            suggestedText: suggestion.suggestedText || 
                          suggestion.suggestion || 
                          suggestion.correction || 
                          suggestion.replacement || '',
            explanation: suggestion.explanation || 
                        suggestion.description || 
                        suggestion.reason || 
                        'No explanation provided',
            startPos: positions.start,
            endPos: positions.end,
            paragraphId: paragraph.paragraphId || `paragraph-${paragraphIndex}`,
            status: 'pending',
            confidence: suggestion.confidence || suggestion.score || 0.8
          });
        });
      });
    }
  } catch (error) {
    console.error('Error processing grammar analysis suggestions:', error);
  }

  console.log(`Created ${suggestions.length} suggestions for redlining`);

  return {
    id: `redline-${Date.now()}`,
    originalContent: originalContent, // PRESERVE EXACT FORMATTING for display
    currentContent: originalContent,  // Start with original formatting
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
 * Enhanced original content extraction that PRESERVES ALL FORMATTING for redline display
 */
function extractOriginalContentForDisplay(grammarResult: any, originalDocument: { content: string }): string {
  console.log('Extracting original content with FULL formatting preservation for redline display');
  
  const contentSources = [
    // Priority 1: Original document content (NEVER cleaned, preserves all formatting)
    originalDocument?.content,
    
    // Priority 2: Metadata paths that might preserve original formatting
    grammarResult?.metadata?.originalContent,
    grammarResult?.input?.originalContent,
    grammarResult?.originalContent,
    
    // Priority 3: Input content (might be cleaned but better than nothing)
    grammarResult?.input?.content,
    
    // Priority 4: Extract from analysis paragraphs
    extractFromAnalysisParagraphs(grammarResult),
    
    // Priority 5: Any content field
    grammarResult?.content
  ];
  
  for (const source of contentSources) {
    if (source && typeof source === 'string' && source.length > 0) {
      console.log(`Using content source with length: ${source.length}`);
      console.log('Content formatting preserved:', {
        hasLineBreaks: source.includes('\n'),
        hasDoubleLineBreaks: source.includes('\n\n'),
        hasSpaces: source.includes('  '),
        leadingWhitespace: source.match(/^[\s\n]+/)?.[0]?.length || 0,
        trailingWhitespace: source.match(/[\s\n]+$/)?.[0]?.length || 0
      });
      // DO NOT TRIM - preserve exact formatting for redline display
      return source;
    }
  }
  
  console.warn('Could not extract meaningful original content');
  return 'Original document content could not be retrieved';
}

/**
 * Extract content from analysis paragraphs as fallback
 */
function extractFromAnalysisParagraphs(grammarResult: any): string {
  try {
    const analysisData = grammarResult?.output?.analysis || grammarResult?.analysis;
    
    if (analysisData && Array.isArray(analysisData)) {
      const reconstructedContent = analysisData
        .map((para: any) => {
          return para.originalContent || 
                 para.original || 
                 para.text || 
                 para.content || '';
        })
        .filter((content: string) => content.length > 0)
        .join('\n\n'); // Preserve paragraph separation
      
      if (reconstructedContent.length > 0) {
        console.log('Reconstructed content from analysis paragraphs with formatting preservation');
        return reconstructedContent;
      }
    }
  } catch (error) {
    console.error('Error extracting from analysis paragraphs:', error);
  }
  
  return '';
}

/**
 * Enhanced position calculation with better whitespace-aware text matching
 */
function calculateSuggestionPositionsWithWhitespaceHandling(
  suggestion: any,
  paragraph: any,
  originalContent: string,
  paragraphIndex: number
): { start: number; end: number } {
  const originalText = suggestion.originalText || 
                      suggestion.issue || 
                      suggestion.text || 
                      suggestion.original || '';
  
  if (!originalText || originalText.length === 0) {
    console.warn('No original text for suggestion, using default positions');
    return { start: 0, end: 0 };
  }
  
  const searchText = originalText;
  
  // Try exact match first (preserving all whitespace)
  let startPos = originalContent.indexOf(searchText);
  
  // Try case-insensitive match with exact whitespace
  if (startPos === -1) {
    startPos = originalContent.toLowerCase().indexOf(searchText.toLowerCase());
  }
  
  // Try normalized whitespace matching (compress multiple spaces to single)
  if (startPos === -1) {
    const normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
    const normalizedContent = originalContent.replace(/\s+/g, ' ');
    const normalizedPos = normalizedContent.toLowerCase().indexOf(normalizedSearch.toLowerCase());
    
    if (normalizedPos !== -1) {
      // Map back to original content position
      startPos = mapNormalizedToOriginalPosition(normalizedPos, originalContent);
    }
  }
  
  // Try partial matching (first 20 characters)
  if (startPos === -1 && searchText.length > 20) {
    const partialText = searchText.substring(0, 20);
    startPos = originalContent.indexOf(partialText);
  }
  
  // If still not found, estimate position based on paragraph
  if (startPos === -1) {
    console.warn(`Could not find text "${searchText.substring(0, 50)}..." in original content`);
    startPos = estimatePositionByParagraph(originalContent, paragraphIndex);
  }
  
  const endPos = startPos + searchText.length;
  
  console.log(`Positioned suggestion "${searchText.substring(0, 30)}..." at ${startPos}-${endPos}`);
  
  return {
    start: Math.max(0, startPos),
    end: Math.min(originalContent.length, endPos)
  };
}

/**
 * Maps position from normalized content back to original content
 */
function mapNormalizedToOriginalPosition(normalizedPos: number, originalContent: string): number {
  let originalPos = 0;
  let normalizedCount = 0;
  
  while (originalPos < originalContent.length && normalizedCount < normalizedPos) {
    const char = originalContent[originalPos];
    if (char.match(/\s/)) {
      // Skip consecutive whitespace in normalization
      while (originalPos < originalContent.length && originalContent[originalPos].match(/\s/)) {
        originalPos++;
      }
      normalizedCount++; // Count as single space in normalized version
    } else {
      originalPos++;
      normalizedCount++;
    }
  }
  
  return originalPos;
}

/**
 * Estimate position based on paragraph index
 */
function estimatePositionByParagraph(content: string, paragraphIndex: number): number {
  const paragraphs = content.split(/\n\s*\n/);
  let estimatedStart = 0;
  
  for (let i = 0; i < Math.min(paragraphIndex, paragraphs.length); i++) {
    estimatedStart += paragraphs[i].length + 2; // +2 for paragraph separation
  }
  
  return Math.max(0, Math.min(content.length, estimatedStart));
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
