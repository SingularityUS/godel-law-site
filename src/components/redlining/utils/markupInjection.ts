/**
 * Markup Injection Utilities
 * 
 * Purpose: Core logic for injecting redline markup into content
 */

import { RedlineSuggestion } from "@/types/redlining";
import { escapeHtml } from "./htmlUtils";
import { getSeverityClass, getTypeClass, getTypeIcon } from "./styleUtils";

/**
 * Temporary marker for paragraph breaks to preserve them during processing
 */
const PARAGRAPH_MARKER = '___PARAGRAPH_BREAK___';

/**
 * Preserves paragraph breaks by converting them to temporary markers
 */
const preserveParagraphBreaks = (content: string): string => {
  return content.replace(/\n\n/g, PARAGRAPH_MARKER);
};

/**
 * Restores paragraph breaks from temporary markers and converts to HTML
 */
const restoreParagraphBreaks = (content: string): string => {
  return content.replace(new RegExp(PARAGRAPH_MARKER, 'g'), '</p><p>');
};

/**
 * Creates a redline markup span for a suggestion with interactive elements
 */
const createRedlineMarkup = (
  suggestion: RedlineSuggestion,
  originalText: string,
  isSelected: boolean
): string => {
  const severityClass = getSeverityClass(suggestion.severity);
  const typeClass = getTypeClass(suggestion.type);
  
  // Add checkmark button for pending suggestions
  const checkmarkButton = suggestion.status === 'pending' ? 
    `<span class="redline-accept-btn" data-suggestion-id="${suggestion.id}" title="Accept suggestion">✓</span>` : '';
  
  return `<span class="redline-suggestion ${severityClass} ${typeClass} ${isSelected ? 'selected' : ''}" data-suggestion-id="${suggestion.id}" data-type="${suggestion.type}" data-severity="${suggestion.severity}" data-original-text="${escapeHtml(originalText)}" data-suggested-text="${escapeHtml(suggestion.suggestedText)}" title="${escapeHtml(suggestion.explanation)}"><span class="original-text">${escapeHtml(originalText)}</span><span class="suggested-text" data-editable="true">${escapeHtml(suggestion.suggestedText)}</span>${checkmarkButton}<span class="redline-indicator">${getTypeIcon(suggestion.type)}</span></span>`;
};

/**
 * Validates suggestion data before processing
 */
const validateSuggestion = (suggestion: RedlineSuggestion, contentLength: number): boolean => {
  return (
    suggestion.status === 'pending' && 
    suggestion.startPos !== undefined && 
    suggestion.endPos !== undefined &&
    suggestion.startPos >= 0 && 
    suggestion.endPos <= contentLength &&
    suggestion.startPos < suggestion.endPos
  );
};

/**
 * Applies a single suggestion to content while preserving paragraph markers
 */
const applySuggestion = (
  content: string,
  suggestion: RedlineSuggestion,
  selectedId: string | null
): string => {
  const beforeText = content.substring(0, suggestion.startPos);
  const originalText = content.substring(suggestion.startPos, suggestion.endPos);
  const afterText = content.substring(suggestion.endPos);
  
  // Validate that we're highlighting the expected text
  const expectedText = suggestion.originalText;
  if (expectedText && originalText.trim() !== expectedText.trim()) {
    console.warn(`Text mismatch for suggestion ${suggestion.id}: expected "${expectedText}" but found "${originalText}"`);
  }
  
  const isSelected = selectedId === suggestion.id;
  const redlineMarkup = createRedlineMarkup(suggestion, originalText, isSelected);
  
  return beforeText + redlineMarkup + afterText;
};

/**
 * Processes all suggestions and applies them to content while preserving paragraph structure
 */
export const processSuggestions = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`Processing ${suggestions.length} suggestions for markup injection`);
  
  // Step 1: Preserve paragraph breaks before processing
  const contentWithMarkers = preserveParagraphBreaks(content);
  console.log('Preserved paragraph breaks with markers');
  
  // Filter and sort suggestions
  const validSuggestions = suggestions.filter(s => validateSuggestion(s, content.length));
  console.log(`Applying ${validSuggestions.length} valid suggestions`);
  
  const sortedSuggestions = [...validSuggestions].sort((a, b) => b.startPos - a.startPos);
  
  let enhancedContent = contentWithMarkers;
  
  // Step 2: Apply suggestions while preserving markers
  sortedSuggestions.forEach((suggestion, index) => {
    try {
      // Adjust positions for the markers we added
      const adjustedSuggestion = {
        ...suggestion,
        startPos: adjustPositionForMarkers(suggestion.startPos, content, contentWithMarkers),
        endPos: adjustPositionForMarkers(suggestion.endPos, content, contentWithMarkers)
      };
      
      enhancedContent = applySuggestion(enhancedContent, adjustedSuggestion, selectedId);
      console.log(`Applied suggestion ${index + 1}/${sortedSuggestions.length}`);
    } catch (error) {
      console.error(`Error applying suggestion ${suggestion.id}:`, error);
    }
  });
  
  // Step 3: Convert to HTML structure while preserving redline markup
  const htmlContent = convertToHtmlWithParagraphs(enhancedContent);
  
  console.log('Completed suggestion processing with paragraph preservation');
  return htmlContent;
};

/**
 * Adjusts character positions to account for paragraph markers
 */
const adjustPositionForMarkers = (position: number, originalContent: string, markedContent: string): number => {
  const beforeOriginal = originalContent.substring(0, position);
  const paragraphBreaksCount = (beforeOriginal.match(/\n\n/g) || []).length;
  
  // Each \n\n (2 chars) becomes ___PARAGRAPH_BREAK___ (21 chars), so we add 19 chars per replacement
  return position + (paragraphBreaksCount * (PARAGRAPH_MARKER.length - 2));
};

/**
 * Converts content with paragraph markers to proper HTML structure
 */
const convertToHtmlWithParagraphs = (content: string): string => {
  // First, wrap the entire content in a paragraph
  let htmlContent = `<p>${content}</p>`;
  
  // Then restore paragraph breaks and convert to proper HTML structure
  htmlContent = restoreParagraphBreaks(htmlContent);
  
  // Clean up any empty paragraphs
  htmlContent = htmlContent.replace(/<p>\s*<\/p>/g, '');
  
  // Ensure we don't have nested paragraphs (shouldn't happen but safety check)
  htmlContent = htmlContent.replace(/<p>\s*<p>/g, '<p>').replace(/<\/p>\s*<\/p>/g, '</p>');
  
  return htmlContent;
};
