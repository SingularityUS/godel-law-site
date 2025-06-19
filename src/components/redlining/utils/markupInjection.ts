
/**
 * Markup Injection Utilities
 * 
 * Purpose: Simplified markup injection that preserves original content
 */

import { RedlineSuggestion } from "@/types/redlining";
import { processContentWithRedlines } from "./contentProcessor";

/**
 * Main function to process suggestions and apply them to content
 * This is the core entry point that preserves original text
 */
export const processSuggestions = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`=== PROCESSING SUGGESTIONS (Content-Preserving) ===`);
  console.log(`Content length: ${content.length}, Suggestions: ${suggestions.length}`);
  
  if (!content || content.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  if (suggestions.length === 0) {
    console.log('No suggestions to process, returning formatted content');
    return content;
  }
  
  // Use the new content processor that preserves original text
  const enhancedContent = processContentWithRedlines(content, suggestions, selectedId);
  
  console.log('Suggestion processing completed - original text preserved');
  return enhancedContent;
};
