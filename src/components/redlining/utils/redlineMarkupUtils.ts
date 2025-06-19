
/**
 * Redline Markup Utilities
 * 
 * Purpose: Simplified main entry point for redline markup processing that preserves original text
 */

import { RedlineSuggestion } from "@/types/redlining";
import { validateHtml, convertTextToHtml } from "./htmlUtils";
import { processSuggestions } from "./markupInjection";

// Re-export utilities for backward compatibility
export { escapeHtml, hasHtmlMarkup, convertTextToHtml, validateHtml, stripRedlineMarkup } from "./htmlUtils";
export { getSeverityClass, getTypeClass, getTypeIcon } from "./styleUtils";
export { processSuggestions } from "./markupInjection";

/**
 * Injects redline markup into content while preserving original text
 */
export const injectRedlineMarkup = (
  content: string, 
  suggestions: RedlineSuggestion[], 
  selectedId: string | null
): string => {
  console.log(`=== INJECTING REDLINE MARKUP (Text-Preserving) ===`);
  console.log(`Content: ${content?.length || 0} chars, Suggestions: ${suggestions?.length || 0}`);
  
  // Validate inputs
  if (!content || content.trim().length === 0) {
    console.warn('No content provided for redline markup');
    return '<p>No content available</p>';
  }
  
  if (!suggestions || suggestions.length === 0) {
    console.log('No suggestions provided, returning formatted content');
    const formattedContent = convertTextToHtml(content);
    return validateHtml(formattedContent);
  }
  
  try {
    // Process suggestions with our enhanced system that preserves original text
    const enhancedContent = processSuggestions(content, suggestions, selectedId);
    
    // Validate the final HTML structure
    const validatedContent = validateHtml(enhancedContent);
    
    console.log('Redline markup injection completed successfully - original text preserved');
    return validatedContent;
  } catch (error) {
    console.error('Error during redline markup injection:', error);
    
    // Fallback: return content without redline markup
    const fallbackContent = convertTextToHtml(content);
    return validateHtml(fallbackContent);
  }
};
