/**
 * Content Processor
 * 
 * Purpose: Processes content while preserving original text structure
 */

import { RedlineSuggestion } from "@/types/redlining";
import { hasHtmlMarkup, convertTextToHtml, extractPlainText } from "./htmlUtils";
import { createRedlineSpan, validateSuggestionForMarkup, createPlainTextSpan } from "./markupGenerators";

interface TextSegment {
  start: number;
  end: number;
  text: string;
  suggestion?: RedlineSuggestion;
}

/**
 * Processes content by preserving original text and adding redline overlays
 */
export const processContentWithRedlines = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('Processing content with redlines - preserving original text');
  console.log(`Content length: ${content.length}, Suggestions: ${suggestions.length}`);
  
  if (!content || content.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  if (suggestions.length === 0) {
    return hasHtmlMarkup(content) ? content : convertTextToHtml(content);
  }
  
  // Work with plain text for position calculations
  const workingText = hasHtmlMarkup(content) ? extractPlainText(content) : content;
  
  // Filter and validate suggestions
  const validSuggestions = suggestions.filter(s => 
    validateSuggestionForMarkup(s, workingText.length)
  );
  
  if (validSuggestions.length === 0) {
    console.log('No valid suggestions found, returning original content');
    return hasHtmlMarkup(content) ? content : convertTextToHtml(content);
  }
  
  // Create text segments with original text preserved
  const segments = createTextSegments(workingText, validSuggestions);
  
  // Generate HTML with redline markup
  const htmlContent = segments
    .map(segment => {
      if (segment.suggestion) {
        const isSelected = selectedId === segment.suggestion.id;
        return createRedlineSpan(segment.suggestion, segment.text, isSelected);
      } else {
        return createPlainTextSpan(segment.text);
      }
    })
    .join('');
  
  // Convert to HTML structure if needed
  return convertTextToHtml(htmlContent);
};

/**
 * Creates text segments that preserve original text structure
 */
const createTextSegments = (
  text: string, 
  suggestions: RedlineSuggestion[]
): TextSegment[] => {
  // Remove overlapping suggestions - keep the first one encountered
  const resolvedSuggestions = resolveOverlaps(suggestions);
  
  // Sort suggestions by position
  const sortedSuggestions = resolvedSuggestions.sort((a, b) => a.startPos - b.startPos);
  
  const segments: TextSegment[] = [];
  let currentPos = 0;
  
  for (const suggestion of sortedSuggestions) {
    // Add text before suggestion (if any)
    if (currentPos < suggestion.startPos) {
      segments.push({
        start: currentPos,
        end: suggestion.startPos,
        text: text.substring(currentPos, suggestion.startPos)
      });
    }
    
    // Add suggestion segment with original text preserved
    const originalText = text.substring(suggestion.startPos, suggestion.endPos);
    segments.push({
      start: suggestion.startPos,
      end: suggestion.endPos,
      text: originalText,
      suggestion: suggestion
    });
    
    currentPos = suggestion.endPos;
  }
  
  // Add remaining text after last suggestion
  if (currentPos < text.length) {
    segments.push({
      start: currentPos,
      end: text.length,
      text: text.substring(currentPos)
    });
  }
  
  return segments;
};

/**
 * Resolves overlapping suggestions by keeping the first one
 */
const resolveOverlaps = (suggestions: RedlineSuggestion[]): RedlineSuggestion[] => {
  const resolved: RedlineSuggestion[] = [];
  const sortedSuggestions = [...suggestions].sort((a, b) => a.startPos - b.startPos);
  
  for (const suggestion of sortedSuggestions) {
    // Check if this suggestion overlaps with any already resolved
    const hasOverlap = resolved.some(existing => 
      (suggestion.startPos < existing.endPos && suggestion.endPos > existing.startPos)
    );
    
    if (!hasOverlap) {
      resolved.push(suggestion);
    } else {
      console.warn(`Skipping overlapping suggestion: ${suggestion.id}`);
    }
  }
  
  console.log(`Resolved ${resolved.length} non-overlapping suggestions from ${suggestions.length} total`);
  return resolved;
};
