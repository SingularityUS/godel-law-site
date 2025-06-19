
/**
 * HTML-Aware Processor
 * 
 * Purpose: Process content with redline suggestions while preserving HTML formatting
 */

import { RedlineSuggestion } from "@/types/redlining";
import { createRedlineSpan, validateSuggestionForMarkup } from "./markupGenerators";

interface HtmlSegment {
  type: 'text' | 'tag';
  content: string;
  startPos: number;
  endPos: number;
  textStartPos?: number; // Position in plain text
  textEndPos?: number;   // Position in plain text
}

/**
 * Process HTML content with redline suggestions while preserving formatting
 */
export const processHtmlWithRedlines = (
  htmlContent: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('=== HTML-AWARE REDLINE PROCESSING ===');
  console.log(`HTML content length: ${htmlContent.length}`);
  console.log(`Suggestions: ${suggestions.length}`);
  
  if (!htmlContent || htmlContent.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  if (!suggestions || suggestions.length === 0) {
    return htmlContent;
  }
  
  try {
    // Parse HTML into segments while tracking text positions
    const segments = parseHtmlToSegments(htmlContent);
    console.log(`Parsed ${segments.length} HTML segments`);
    
    // Extract plain text for position mapping
    const plainText = extractPlainTextFromSegments(segments);
    console.log(`Extracted plain text length: ${plainText.length}`);
    
    // Validate and sort suggestions
    const validSuggestions = suggestions
      .filter(s => validateSuggestionForMarkup(s, plainText.length))
      .sort((a, b) => a.startPos - b.startPos);
    
    console.log(`Using ${validSuggestions.length} valid suggestions`);
    
    // Apply suggestions to segments
    const processedSegments = applySuggestionsToSegments(
      segments, 
      validSuggestions, 
      selectedId
    );
    
    // Reconstruct HTML
    const result = reconstructHtmlFromSegments(processedSegments);
    
    console.log('HTML-aware processing complete');
    return result;
    
  } catch (error) {
    console.error('Error in HTML-aware processing:', error);
    return htmlContent; // Fallback to original
  }
};

/**
 * Parse HTML content into segments while tracking text positions
 */
function parseHtmlToSegments(htmlContent: string): HtmlSegment[] {
  const segments: HtmlSegment[] = [];
  let htmlPos = 0;
  let textPos = 0;
  
  while (htmlPos < htmlContent.length) {
    // Look for HTML tags
    const tagStart = htmlContent.indexOf('<', htmlPos);
    
    if (tagStart === -1) {
      // No more tags, rest is text
      const textContent = htmlContent.substring(htmlPos);
      if (textContent.length > 0) {
        segments.push({
          type: 'text',
          content: textContent,
          startPos: htmlPos,
          endPos: htmlContent.length,
          textStartPos: textPos,
          textEndPos: textPos + textContent.length
        });
      }
      break;
    }
    
    // Add text before tag (if any)
    if (tagStart > htmlPos) {
      const textContent = htmlContent.substring(htmlPos, tagStart);
      segments.push({
        type: 'text',
        content: textContent,
        startPos: htmlPos,
        endPos: tagStart,
        textStartPos: textPos,
        textEndPos: textPos + textContent.length
      });
      textPos += textContent.length;
    }
    
    // Find tag end
    const tagEnd = htmlContent.indexOf('>', tagStart);
    if (tagEnd === -1) {
      // Malformed HTML, treat rest as text
      const textContent = htmlContent.substring(htmlPos);
      segments.push({
        type: 'text',
        content: textContent,
        startPos: htmlPos,
        endPos: htmlContent.length,
        textStartPos: textPos,
        textEndPos: textPos + textContent.length
      });
      break;
    }
    
    // Add tag segment
    const tagContent = htmlContent.substring(tagStart, tagEnd + 1);
    segments.push({
      type: 'tag',
      content: tagContent,
      startPos: tagStart,
      endPos: tagEnd + 1
    });
    
    htmlPos = tagEnd + 1;
  }
  
  return segments;
}

/**
 * Extract plain text from segments for position mapping
 */
function extractPlainTextFromSegments(segments: HtmlSegment[]): string {
  return segments
    .filter(s => s.type === 'text')
    .map(s => s.content)
    .join('');
}

/**
 * Apply suggestions to HTML segments
 */
function applySuggestionsToSegments(
  segments: HtmlSegment[],
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): HtmlSegment[] {
  console.log('Applying suggestions to HTML segments');
  
  const processedSegments: HtmlSegment[] = [];
  
  for (const segment of segments) {
    if (segment.type === 'tag') {
      // Tags are preserved as-is
      processedSegments.push(segment);
      continue;
    }
    
    // Process text segments
    const textSegments = applyRedlinesToTextSegment(segment, suggestions, selectedId);
    processedSegments.push(...textSegments);
  }
  
  return processedSegments;
}

/**
 * Apply redline suggestions to a single text segment
 */
function applyRedlinesToTextSegment(
  textSegment: HtmlSegment,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): HtmlSegment[] {
  const { content, textStartPos = 0, textEndPos = 0 } = textSegment;
  
  // Find suggestions that apply to this text segment
  const applicableSuggestions = suggestions.filter(s => 
    s.startPos >= textStartPos && s.endPos <= textEndPos
  );
  
  if (applicableSuggestions.length === 0) {
    return [textSegment];
  }
  
  console.log(`Applying ${applicableSuggestions.length} suggestions to text segment`);
  
  const segments: HtmlSegment[] = [];
  let currentPos = 0;
  
  // Sort suggestions by position within this text segment
  const sortedSuggestions = applicableSuggestions
    .sort((a, b) => (a.startPos - textStartPos) - (b.startPos - textStartPos));
  
  for (const suggestion of sortedSuggestions) {
    const relativeStart = suggestion.startPos - textStartPos;
    const relativeEnd = suggestion.endPos - textStartPos;
    
    // Add text before suggestion
    if (currentPos < relativeStart) {
      const beforeText = content.substring(currentPos, relativeStart);
      segments.push({
        type: 'text',
        content: beforeText,
        startPos: textSegment.startPos + currentPos,
        endPos: textSegment.startPos + relativeStart
      });
    }
    
    // Add suggestion with redline markup
    const suggestionText = content.substring(relativeStart, relativeEnd);
    const isSelected = suggestion.id === selectedId;
    const redlineSpan = createRedlineSpan(suggestion, suggestionText, isSelected);
    
    segments.push({
      type: 'text',
      content: redlineSpan,
      startPos: textSegment.startPos + relativeStart,
      endPos: textSegment.startPos + relativeEnd
    });
    
    currentPos = relativeEnd;
  }
  
  // Add remaining text
  if (currentPos < content.length) {
    const remainingText = content.substring(currentPos);
    segments.push({
      type: 'text',
      content: remainingText,
      startPos: textSegment.startPos + currentPos,
      endPos: textSegment.endPos
    });
  }
  
  return segments;
}

/**
 * Reconstruct HTML from processed segments
 */
function reconstructHtmlFromSegments(segments: HtmlSegment[]): string {
  return segments.map(s => s.content).join('');
}
