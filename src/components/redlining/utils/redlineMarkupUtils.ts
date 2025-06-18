
/**
 * Redline Markup Utilities
 * 
 * Purpose: Main entry point for redline markup processing
 */

import { RedlineSuggestion } from "@/types/redlining";
import { validateHtml } from "./htmlUtils";
import { processSuggestions } from "./markupInjection";

// Re-export utilities for backward compatibility
export { escapeHtml, hasHtmlMarkup, convertTextToHtml, validateHtml } from "./htmlUtils";
export { getSeverityClass, getTypeClass, getTypeIcon } from "./styleUtils";
export { processSuggestions } from "./markupInjection";

/**
 * Injects redline markup into content with smart positioning
 */
export const injectRedlineMarkup = (
  content: string, 
  suggestions: RedlineSuggestion[], 
  selectedId: string | null
): string => {
  console.log(`Injecting redline markup into content (${content.length} chars) with ${suggestions.length} suggestions`);
  
  if (!content || content.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  // Process suggestions with smart positioning that handles both HTML and plain text
  const enhancedContent = processSuggestions(content, suggestions, selectedId);
  
  // Validate the final HTML structure
  const validatedContent = validateHtml(enhancedContent);
  
  console.log('Redline markup injection complete with smart positioning');
  return validatedContent;
};
