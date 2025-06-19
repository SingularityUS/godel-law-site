
/**
 * Markup Generators
 * 
 * Purpose: Clean, focused markup generation for redline suggestions
 */

import { RedlineSuggestion } from "@/types/redlining";
import { escapeHtml } from "./htmlUtils";
import { getSeverityClass, getTypeClass } from "./styleUtils";

/**
 * Creates a clean redline markup span that preserves original text
 */
export const createRedlineSpan = (
  suggestion: RedlineSuggestion,
  originalText: string,
  isSelected: boolean
): string => {
  const severityClass = getSeverityClass(suggestion.severity);
  const typeClass = getTypeClass(suggestion.type);
  const selectedClass = isSelected ? 'selected' : '';
  
  // Clean the text content - remove any HTML fragments
  const cleanOriginalText = originalText.replace(/<[^>]*>/g, '').trim();
  const cleanSuggestedText = suggestion.suggestedText.replace(/<[^>]*>/g, '').trim();
  const cleanExplanation = suggestion.explanation.replace(/<[^>]*>/g, '').replace(/"/g, '&quot;');
  
  // Create a simple highlight span that preserves the original text
  return `<span class="redline-suggestion ${severityClass} ${typeClass} ${selectedClass}" 
    data-suggestion-id="${suggestion.id}" 
    data-type="${suggestion.type}" 
    data-severity="${suggestion.severity}" 
    data-original="${escapeHtml(cleanOriginalText)}" 
    data-suggested="${escapeHtml(cleanSuggestedText)}" 
    title="${cleanExplanation}">${escapeHtml(cleanOriginalText)}</span>`;
};

/**
 * Validates suggestion data before markup generation
 */
export const validateSuggestionForMarkup = (
  suggestion: RedlineSuggestion, 
  contentLength: number
): boolean => {
  return (
    suggestion.status === 'pending' && 
    suggestion.startPos !== undefined && 
    suggestion.endPos !== undefined &&
    suggestion.startPos >= 0 && 
    suggestion.endPos <= contentLength &&
    suggestion.startPos < suggestion.endPos &&
    suggestion.originalText.trim().length > 0 &&
    suggestion.suggestedText.trim().length > 0
  );
};

/**
 * Creates markup for a range of text without suggestions
 */
export const createPlainTextSpan = (text: string): string => {
  return escapeHtml(text);
};
