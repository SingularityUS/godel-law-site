
/**
 * Markup Injection Utilities
 * 
 * Purpose: Core logic for injecting clean redline markup into content
 */

import { RedlineSuggestion } from "@/types/redlining";
import { escapeHtml, hasHtmlMarkup } from "./htmlUtils";
import { getSeverityClass, getTypeClass, getTypeIcon } from "./styleUtils";
import { createPositionMapping, mapPlainTextToHtml, findTextInHtml, extractPlainText } from "./positionMapping";

/**
 * Creates a clean, simple redline markup span
 */
const createRedlineMarkup = (
  suggestion: RedlineSuggestion,
  originalText: string,
  isSelected: boolean
): string => {
  const severityClass = getSeverityClass(suggestion.severity);
  const typeClass = getTypeClass(suggestion.type);
  const selectedClass = isSelected ? 'selected' : '';
  
  // Clean the text content - no HTML fragments
  const cleanOriginalText = originalText.replace(/<[^>]*>/g, '').trim();
  const cleanSuggestedText = suggestion.suggestedText.replace(/<[^>]*>/g, '').trim();
  const cleanExplanation = suggestion.explanation.replace(/<[^>]*>/g, '').replace(/"/g, '&quot;');
  
  // Simple span structure without nesting issues
  return `<span class="redline-suggestion ${severityClass} ${typeClass} ${selectedClass}" 
    data-suggestion-id="${suggestion.id}" 
    data-type="${suggestion.type}" 
    data-severity="${suggestion.severity}" 
    data-original="${escapeHtml(cleanOriginalText)}" 
    data-suggested="${escapeHtml(cleanSuggestedText)}" 
    title="${cleanExplanation}">${escapeHtml(cleanOriginalText)}</span>`;
};

/**
 * Detects overlapping suggestions and resolves conflicts
 */
const resolvePositionConflicts = (suggestions: RedlineSuggestion[]): RedlineSuggestion[] => {
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

/**
 * Removes duplicate suggestions based on position and text
 */
const deduplicateSuggestions = (suggestions: RedlineSuggestion[]): RedlineSuggestion[] => {
  const seen = new Set<string>();
  const unique: RedlineSuggestion[] = [];
  
  for (const suggestion of suggestions) {
    const key = `${suggestion.startPos}-${suggestion.endPos}-${suggestion.originalText.trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(suggestion);
    }
  }
  
  console.log(`Deduplicated to ${unique.length} unique suggestions from ${suggestions.length} total`);
  return unique;
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
    suggestion.startPos < suggestion.endPos &&
    suggestion.originalText.trim().length > 0 &&
    suggestion.suggestedText.trim().length > 0
  );
};

/**
 * Applies suggestions to plain text content with improved position handling
 */
const applySuggestionsToPlainText = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`Applying ${suggestions.length} suggestions to plain text`);
  
  // Process suggestions in reverse order to maintain positions
  const sortedSuggestions = [...suggestions].sort((a, b) => b.startPos - a.startPos);
  let result = content;
  
  for (const suggestion of sortedSuggestions) {
    try {
      const beforeText = result.substring(0, suggestion.startPos);
      const originalText = result.substring(suggestion.startPos, suggestion.endPos);
      const afterText = result.substring(suggestion.endPos);
      
      // Validate that we're highlighting the expected text
      if (originalText.trim() !== suggestion.originalText.trim()) {
        console.warn(`Text mismatch for suggestion ${suggestion.id}`);
        continue;
      }
      
      const isSelected = selectedId === suggestion.id;
      const redlineMarkup = createRedlineMarkup(suggestion, originalText, isSelected);
      
      result = beforeText + redlineMarkup + afterText;
      console.log(`Applied suggestion ${suggestion.id} successfully`);
    } catch (error) {
      console.error(`Error applying suggestion ${suggestion.id}:`, error);
    }
  }
  
  return result;
};

/**
 * Applies suggestions to HTML content with smart positioning
 */
const applySuggestionsToHtml = (
  htmlContent: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`Applying ${suggestions.length} suggestions to HTML content`);
  
  // Extract plain text for position validation
  const plainText = extractPlainText(htmlContent);
  const mapping = createPositionMapping(htmlContent);
  
  // Process suggestions in reverse order
  const sortedSuggestions = [...suggestions].sort((a, b) => b.startPos - a.startPos);
  let result = htmlContent;
  
  for (const suggestion of sortedSuggestions) {
    try {
      // Map plain text positions to HTML positions
      const htmlStart = mapPlainTextToHtml(suggestion.startPos, mapping);
      const htmlEnd = mapPlainTextToHtml(suggestion.endPos, mapping);
      
      if (htmlStart < result.length && htmlEnd <= result.length && htmlStart < htmlEnd) {
        const beforeText = result.substring(0, htmlStart);
        const originalText = extractPlainText(result.substring(htmlStart, htmlEnd));
        const afterText = result.substring(htmlEnd);
        
        // Validate text match
        if (originalText.trim() === suggestion.originalText.trim()) {
          const isSelected = selectedId === suggestion.id;
          const redlineMarkup = createRedlineMarkup(suggestion, originalText, isSelected);
          result = beforeText + redlineMarkup + afterText;
          console.log(`Applied HTML suggestion ${suggestion.id} successfully`);
          continue;
        }
      }
      
      // Fallback to text-based matching
      const textMatch = findTextInHtml(result, suggestion.originalText);
      if (textMatch) {
        const beforeText = result.substring(0, textMatch.start);
        const afterText = result.substring(textMatch.end);
        const isSelected = selectedId === suggestion.id;
        const redlineMarkup = createRedlineMarkup(suggestion, suggestion.originalText, isSelected);
        result = beforeText + redlineMarkup + afterText;
        console.log(`Applied HTML suggestion ${suggestion.id} via fallback`);
      } else {
        console.warn(`Could not apply HTML suggestion ${suggestion.id}: text not found`);
      }
    } catch (error) {
      console.error(`Error applying HTML suggestion ${suggestion.id}:`, error);
    }
  }
  
  return result;
};

/**
 * Converts plain text to HTML with paragraph structure
 */
const convertPlainTextToHtml = (content: string): string => {
  if (hasHtmlMarkup(content)) {
    return content;
  }
  
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  
  return paragraphs
    .map(paragraph => {
      const trimmedParagraph = paragraph.trim();
      const paragraphWithBreaks = trimmedParagraph.replace(/\n/g, '<br>');
      return `<p>${paragraphWithBreaks}</p>`;
    })
    .join('');
};

/**
 * Main function to process suggestions and apply them to content
 */
export const processSuggestions = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`=== PROCESSING SUGGESTIONS (Enhanced) ===`);
  console.log(`Content length: ${content.length}, Suggestions: ${suggestions.length}`);
  
  if (!content || content.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  if (suggestions.length === 0) {
    return hasHtmlMarkup(content) ? content : convertPlainTextToHtml(content);
  }
  
  const isHtmlContent = hasHtmlMarkup(content);
  const validationLength = isHtmlContent ? extractPlainText(content).length : content.length;
  
  // Filter, validate, deduplicate, and resolve conflicts
  let processedSuggestions = suggestions.filter(s => validateSuggestion(s, validationLength));
  processedSuggestions = deduplicateSuggestions(processedSuggestions);
  processedSuggestions = resolvePositionConflicts(processedSuggestions);
  
  console.log(`Processing ${processedSuggestions.length} clean suggestions`);
  
  if (processedSuggestions.length === 0) {
    console.log('No valid suggestions to process');
    return hasHtmlMarkup(content) ? content : convertPlainTextToHtml(content);
  }
  
  // Apply suggestions based on content type
  let enhancedContent: string;
  if (isHtmlContent) {
    enhancedContent = applySuggestionsToHtml(content, processedSuggestions, selectedId);
  } else {
    enhancedContent = applySuggestionsToPlainText(content, processedSuggestions, selectedId);
    enhancedContent = convertPlainTextToHtml(enhancedContent);
  }
  
  console.log('Suggestion processing completed successfully');
  return enhancedContent;
};
