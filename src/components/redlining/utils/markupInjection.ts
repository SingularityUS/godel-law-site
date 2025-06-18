
/**
 * Markup Injection Utilities
 * 
 * Purpose: Core logic for injecting redline markup into content while preserving HTML formatting
 */

import { RedlineSuggestion } from "@/types/redlining";
import { escapeHtml, hasHtmlMarkup } from "./htmlUtils";
import { getSeverityClass, getTypeClass, getTypeIcon } from "./styleUtils";
import { createPositionMapping, mapPlainTextToHtml, findTextInHtml, extractPlainText } from "./positionMapping";

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
 * Applies a single suggestion to HTML content using smart positioning
 */
const applySuggestionToHtml = (
  htmlContent: string,
  suggestion: RedlineSuggestion,
  selectedId: string | null
): string => {
  // Try position mapping first
  const mapping = createPositionMapping(htmlContent);
  const htmlStart = mapPlainTextToHtml(suggestion.startPos, mapping);
  const htmlEnd = mapPlainTextToHtml(suggestion.endPos, mapping);
  
  // Validate that the mapped positions make sense
  if (htmlStart < htmlContent.length && htmlEnd <= htmlContent.length && htmlStart < htmlEnd) {
    const beforeText = htmlContent.substring(0, htmlStart);
    const originalText = extractPlainText(htmlContent.substring(htmlStart, htmlEnd));
    const afterText = htmlContent.substring(htmlEnd);
    
    // Verify the text matches what we expect
    if (originalText.trim() === suggestion.originalText.trim()) {
      const isSelected = selectedId === suggestion.id;
      const redlineMarkup = createRedlineMarkup(suggestion, originalText, isSelected);
      return beforeText + redlineMarkup + afterText;
    }
  }
  
  // Fallback: Use text-based matching
  console.warn(`Position mapping failed for suggestion ${suggestion.id}, using text-based matching`);
  const textMatch = findTextInHtml(htmlContent, suggestion.originalText);
  
  if (textMatch) {
    const beforeText = htmlContent.substring(0, textMatch.start);
    const afterText = htmlContent.substring(textMatch.end);
    const isSelected = selectedId === suggestion.id;
    const redlineMarkup = createRedlineMarkup(suggestion, suggestion.originalText, isSelected);
    return beforeText + redlineMarkup + afterText;
  }
  
  console.warn(`Could not apply suggestion ${suggestion.id}: text not found`);
  return htmlContent;
};

/**
 * Applies a single suggestion to plain text content
 */
const applySuggestionToPlainText = (
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
 * Converts plain text content to HTML with paragraph structure
 */
const convertPlainTextToHtml = (content: string): string => {
  console.log('Converting plain text to HTML with paragraph structure');
  
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
 * Processes all suggestions and applies them to content with smart positioning
 */
export const processSuggestions = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`Processing ${suggestions.length} suggestions for markup injection`);
  
  const isHtmlContent = hasHtmlMarkup(content);
  console.log('Content type:', isHtmlContent ? 'HTML' : 'Plain Text');
  
  // Filter and validate suggestions based on content type
  let validSuggestions: RedlineSuggestion[];
  
  if (isHtmlContent) {
    // For HTML content, validate against plain text length
    const plainTextLength = extractPlainText(content).length;
    validSuggestions = suggestions.filter(s => validateSuggestion(s, plainTextLength));
  } else {
    validSuggestions = suggestions.filter(s => validateSuggestion(s, content.length));
  }
  
  console.log(`Applying ${validSuggestions.length} valid suggestions`);
  
  // Sort suggestions by position (descending to avoid position shifts)
  const sortedSuggestions = [...validSuggestions].sort((a, b) => b.startPos - a.startPos);
  
  let enhancedContent = content;
  
  // Apply suggestions based on content type
  sortedSuggestions.forEach((suggestion, index) => {
    try {
      if (isHtmlContent) {
        enhancedContent = applySuggestionToHtml(enhancedContent, suggestion, selectedId);
      } else {
        enhancedContent = applySuggestionToPlainText(enhancedContent, suggestion, selectedId);
      }
      console.log(`Applied suggestion ${index + 1}/${sortedSuggestions.length}`);
    } catch (error) {
      console.error(`Error applying suggestion ${suggestion.id}:`, error);
    }
  });
  
  // Convert to HTML if needed (only for plain text)
  if (!hasHtmlMarkup(enhancedContent)) {
    enhancedContent = convertPlainTextToHtml(enhancedContent);
  }
  
  console.log('Completed suggestion processing with smart positioning');
  return enhancedContent;
};
