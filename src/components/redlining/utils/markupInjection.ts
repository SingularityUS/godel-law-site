
/**
 * Markup Injection Utilities
 * 
 * Purpose: Core logic for injecting redline markup into content
 */

import { RedlineSuggestion } from "@/types/redlining";
import { escapeHtml } from "./htmlUtils";
import { getSeverityClass, getTypeClass, getTypeIcon } from "./styleUtils";

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
 * Applies a single suggestion to content
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
 * Converts content to HTML structure while preserving paragraph breaks
 */
const convertToHtmlWithParagraphs = (content: string): string => {
  // Split on double line breaks to identify paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs
    .map(paragraph => {
      const trimmedParagraph = paragraph.trim();
      if (trimmedParagraph === '') {
        return ''; // Skip empty paragraphs
      }
      
      // Within each paragraph, convert single line breaks to <br> tags
      const paragraphWithBreaks = trimmedParagraph.replace(/\n/g, '<br>');
      return `<p>${paragraphWithBreaks}</p>`;
    })
    .filter(p => p !== '') // Remove empty paragraphs
    .join('');
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
  
  // Filter and sort suggestions
  const validSuggestions = suggestions.filter(s => validateSuggestion(s, content.length));
  console.log(`Applying ${validSuggestions.length} valid suggestions`);
  
  const sortedSuggestions = [...validSuggestions].sort((a, b) => b.startPos - a.startPos);
  
  let enhancedContent = content;
  
  // Apply suggestions to the raw content first
  sortedSuggestions.forEach((suggestion, index) => {
    try {
      enhancedContent = applySuggestion(enhancedContent, suggestion, selectedId);
      console.log(`Applied suggestion ${index + 1}/${sortedSuggestions.length}`);
    } catch (error) {
      console.error(`Error applying suggestion ${suggestion.id}:`, error);
    }
  });
  
  // Convert to HTML structure while preserving paragraph breaks
  const htmlContent = convertToHtmlWithParagraphs(enhancedContent);
  
  console.log('Completed suggestion processing with paragraph preservation');
  return htmlContent;
};
