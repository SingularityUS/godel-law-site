/**
 * Content Processor
 * 
 * Purpose: PHASE 1 DEBUG - Focus on displaying original content only
 */

import { RedlineSuggestion } from "@/types/redlining";
import { hasHtmlMarkup, convertTextToHtml } from "./htmlUtils";

/**
 * PHASE 1: Temporarily simplified to display ONLY original content for debugging
 */
export const processContentWithRedlines = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('=== CONTENT PROCESSOR (PHASE 1: Original Content Only) ===');
  console.log('🎯 DEBUGGING: Displaying original content WITHOUT suggestions');
  console.log(`Content length: ${content.length}`);
  console.log('Content preview (first 200 chars):', content.substring(0, 200));
  console.log('Content preview (last 100 chars):', content.slice(-100));
  console.log(`Suggestions available: ${suggestions.length} (TEMPORARILY IGNORED)`);
  
  if (!content || content.trim().length === 0) {
    console.warn('❌ No content provided to process');
    return '<p>No content available</p>';
  }
  
  // PHASE 1: Return original content only, properly formatted
  console.log('Content type:', hasHtmlMarkup(content) ? 'HTML' : 'Plain text');
  
  if (hasHtmlMarkup(content)) {
    console.log('✅ Content is HTML, returning as-is');
    return content;
  } else {
    console.log('✅ Content is plain text, converting to HTML');
    const htmlContent = convertTextToHtml(content);
    console.log('Converted to HTML, length:', htmlContent.length);
    return htmlContent;
  }
};

// Keep the existing interface for compatibility but don't use the complex logic yet
interface TextSegment {
  start: number;
  end: number;
  text: string;
  suggestion?: RedlineSuggestion;
  isHtml?: boolean;
}

// Placeholder functions for when we re-enable suggestions in Phase 2
const processHtmlContentWithRedlines = (content: string) => content;
const processPlainTextContentWithRedlines = (content: string) => convertTextToHtml(content);
const applyRedlinesToHtml = (content: string) => content;
const createTextSegments = (content: string) => [];
const resolveOverlaps = (suggestions: RedlineSuggestion[]) => suggestions;
