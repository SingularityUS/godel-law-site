
/**
 * HTML-Aware Processor
 * 
 * Purpose: Process content with redline suggestions while preserving HTML formatting
 */

import { RedlineSuggestion } from "@/types/redlining";
import { createRedlineSpan, validateSuggestionForMarkup } from "./markupGenerators";

interface HtmlSegment {
  type: 'text' | 'tag' | 'redline';
  content: string;
  startPos: number;
  endPos: number;
  textStartPos?: number; // Position in plain text
  textEndPos?: number;   // Position in plain text
  isRedlineSpan?: boolean;
}

/**
 * Process HTML content with redline suggestions while preserving formatting
 */
export const processHtmlWithRedlines = (
  htmlContent: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('=== HTML-AWARE REDLINE PROCESSING (Fixed) ===');
  console.log(`HTML content length: ${htmlContent.length}`);
  console.log(`Suggestions: ${suggestions.length}`);
  
  if (!htmlContent || htmlContent.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  if (!suggestions || suggestions.length === 0) {
    console.log('No suggestions to apply, returning original HTML');
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
    
    if (validSuggestions.length === 0) {
      console.log('No valid suggestions after filtering, returning original HTML');
      return htmlContent;
    }
    
    // Apply suggestions to segments
    const processedSegments = applySuggestionsToSegments(
      segments, 
      validSuggestions, 
      selectedId,
      plainText
    );
    
    // Reconstruct HTML with proper redline CSS classes
    const result = reconstructHtmlFromSegments(processedSegments);
    
    console.log('HTML-aware processing complete with redline overlays');
    console.log('Result contains redline spans:', result.includes('redline-suggestion'));
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
  
  // Simple HTML parsing that preserves structure
  const htmlRegex = /<[^>]*>/g;
  let lastIndex = 0;
  let match;
  
  while ((match = htmlRegex.exec(htmlContent)) !== null) {
    // Add text before tag
    if (match.index > lastIndex) {
      const textContent = htmlContent.substring(lastIndex, match.index);
      if (textContent.length > 0) {
        segments.push({
          type: 'text',
          content: textContent,
          startPos: lastIndex,
          endPos: match.index,
          textStartPos: textPos,
          textEndPos: textPos + textContent.length
        });
        textPos += textContent.length;
      }
    }
    
    // Add tag
    segments.push({
      type: 'tag',
      content: match[0],
      startPos: match.index,
      endPos: match.index + match[0].length
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < htmlContent.length) {
    const textContent = htmlContent.substring(lastIndex);
    if (textContent.length > 0) {
      segments.push({
        type: 'text',
        content: textContent,
        startPos: lastIndex,
        endPos: htmlContent.length,
        textStartPos: textPos,
        textEndPos: textPos + textContent.length
      });
    }
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
 * Apply suggestions to HTML segments with proper redline integration
 */
function applySuggestionsToSegments(
  segments: HtmlSegment[],
  suggestions: RedlineSuggestion[],
  selectedId: string | null,
  plainText: string
): HtmlSegment[] {
  console.log('Applying suggestions to HTML segments with redline integration');
  
  const processedSegments: HtmlSegment[] = [];
  
  for (const segment of segments) {
    if (segment.type === 'tag') {
      // Tags are preserved as-is
      processedSegments.push(segment);
      continue;
    }
    
    // Process text segments with suggestions
    const textSegments = applyRedlinesToTextSegment(segment, suggestions, selectedId, plainText);
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
  selectedId: string | null,
  plainText: string
): HtmlSegment[] {
  const { content, textStartPos = 0, textEndPos = 0 } = textSegment;
  
  // Find suggestions that apply to this text segment
  const applicableSuggestions = suggestions.filter(s => {
    const suggestionStart = s.startPos;
    const suggestionEnd = s.endPos;
    
    // Check if suggestion overlaps with this text segment
    return suggestionStart < textEndPos && suggestionEnd > textStartPos;
  });
  
  if (applicableSuggestions.length === 0) {
    return [textSegment];
  }
  
  console.log(`Applying ${applicableSuggestions.length} suggestions to text segment`);
  console.log(`Text segment: "${content.substring(0, 50)}..." (${textStartPos}-${textEndPos})`);
  
  const segments: HtmlSegment[] = [];
  let currentPos = 0;
  
  // Sort suggestions by position within this text segment
  const sortedSuggestions = applicableSuggestions
    .map(s => ({
      ...s,
      relativeStart: Math.max(0, s.startPos - textStartPos),
      relativeEnd: Math.min(content.length, s.endPos - textStartPos)
    }))
    .filter(s => s.relativeStart < s.relativeEnd)
    .sort((a, b) => a.relativeStart - b.relativeStart);
  
  for (const suggestion of sortedSuggestions) {
    const { relativeStart, relativeEnd } = suggestion;
    
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
    
    console.log(`Creating redline span for: "${suggestionText}" -> selected: ${isSelected}`);
    
    segments.push({
      type: 'redline',
      content: redlineSpan,
      startPos: textSegment.startPos + relativeStart,
      endPos: textSegment.startPos + relativeEnd,
      isRedlineSpan: true
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
 * Reconstruct HTML from processed segments with redline styling
 */
function reconstructHtmlFromSegments(segments: HtmlSegment[]): string {
  const result = segments.map(s => s.content).join('');
  
  // Ensure we have the redline container class for proper styling
  const wrappedResult = `<div class="redline-content">${result}</div>`;
  
  console.log('Reconstructed HTML with redline spans');
  console.log('Final result contains redline-suggestion:', wrappedResult.includes('redline-suggestion'));
  
  return wrappedResult;
}
