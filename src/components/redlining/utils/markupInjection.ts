
/**
 * Markup Injection Utilities
 * 
 * Purpose: Enhanced markup injection that preserves original content and HTML structure
 */

import { RedlineSuggestion } from "@/types/redlining";
import { processContentWithRedlines } from "./contentProcessor";

/**
 * Main function to process suggestions and apply them to content
 * This is the core entry point that preserves original text and HTML structure
 */
export const processSuggestions = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log(`=== PROCESSING SUGGESTIONS (Structure & Text Preserving) ===`);
  console.log(`Content length: ${content.length}, Suggestions: ${suggestions.length}`);
  console.log('Content type:', content.includes('<') && content.includes('>') ? 'HTML' : 'Plain text');
  
  if (!content || content.trim().length === 0) {
    console.warn('No content provided to process suggestions');
    return '<p>No content available</p>';
  }
  
  if (suggestions.length === 0) {
    console.log('No suggestions to process, returning original content');
    return content;
  }
  
  try {
    // Use the enhanced content processor that preserves both text and HTML structure
    const enhancedContent = processContentWithRedlines(content, suggestions, selectedId);
    
    console.log('Suggestion processing completed - original content and structure preserved');
    console.log('Enhanced content length:', enhancedContent.length);
    console.log('Enhanced content preview:', enhancedContent.substring(0, 300));
    
    return enhancedContent;
  } catch (error) {
    console.error('Error processing suggestions:', error);
    
    // Fallback: return original content without redline markup
    console.log('Falling back to original content due to processing error');
    return content;
  }
};
