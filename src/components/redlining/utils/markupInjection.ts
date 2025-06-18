
/**
 * Markup Injection Utilities
 * 
 * Purpose: Core logic for injecting redline markup into content while preserving HTML formatting
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
 * Applies a single suggestion to content (works with both plain text and HTML)
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
 * Preserves existing HTML structure while adding paragraph tags only where needed
 */
const preserveHtmlStructure = (content: string): string => {
  // If content already has HTML structure, preserve it
  if (/<[^>]+>/.test(content)) {
    console.log('Content already has HTML structure, preserving it');
    return content;
  }
  
  // If it's plain text, convert to HTML with paragraph structure
  console.log('Converting plain text to HTML with paragraph structure');
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
 * Processes all suggestions and applies them to content while preserving HTML formatting
 */
export const processSuggestions = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`Processing ${suggestions.length} suggestions for markup injection`);
  console.log('Content has HTML formatting:', /<[^>]+>/.test(content));
  
  // Filter and sort suggestions
  const validSuggestions = suggestions.filter(s => validateSuggestion(s, content.length));
  console.log(`Applying ${validSuggestions.length} valid suggestions`);
  
  const sortedSuggestions = [...validSuggestions].sort((a, b) => b.startPos - a.startPos);
  
  let enhancedContent = content;
  
  // Apply suggestions to the content (whether plain text or HTML)
  sortedSuggestions.forEach((suggestion, index) => {
    try {
      enhancedContent = applySuggestion(enhancedContent, suggestion, selectedId);
      console.log(`Applied suggestion ${index + 1}/${sortedSuggestions.length}`);
    } catch (error) {
      console.error(`Error applying suggestion ${suggestion.id}:`, error);
    }
  });
  
  // Preserve HTML structure or convert to HTML if needed
  const htmlContent = preserveHtmlStructure(enhancedContent);
  
  console.log('Completed suggestion processing with HTML formatting preservation');
  return htmlContent;
};
