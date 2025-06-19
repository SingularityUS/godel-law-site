
/**
 * Content Processor
 * 
 * Purpose: Enhanced content processing with redline suggestions display that preserves HTML formatting
 */

import { RedlineSuggestion } from "@/types/redlining";
import { hasHtmlMarkup, convertTextToHtml, escapeHtml } from "./htmlUtils";
import { createRedlineSpan, validateSuggestionForMarkup } from "./markupGenerators";
import { processHtmlWithRedlines } from "./htmlAwareProcessor";

/**
 * Process content with redline suggestions - now with HTML formatting preservation
 */
export const processContentWithRedlines = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('=== CONTENT PROCESSOR (HTML-PRESERVING REDLINES) ===');
  console.log(`Content length: ${content.length}`);
  console.log(`Suggestions: ${suggestions.length}`);
  console.log('Content type:', content.includes('<') && content.includes('>') ? 'HTML' : 'Plain text');
  
  if (!content || content.trim().length === 0) {
    console.warn('❌ No content provided to process');
    return '<p>No content available</p>';
  }
  
  // If no suggestions, return formatted content
  if (!suggestions || suggestions.length === 0) {
    console.log('No suggestions to apply, returning formatted content');
    return hasHtmlMarkup(content) ? content : convertTextToHtml(content);
  }
  
  console.log('Processing suggestions:', suggestions.map(s => ({
    id: s.id,
    type: s.type,
    originalText: s.originalText.substring(0, 30) + '...',
    startPos: s.startPos,
    endPos: s.endPos
  })));
  
  try {
    // Process based on content type - now with HTML preservation
    if (hasHtmlMarkup(content)) {
      console.log('Processing HTML content with formatting preservation');
      return processHtmlWithRedlines(content, suggestions, selectedId);
    } else {
      console.log('Processing plain text content with redlines');
      return processPlainTextContentWithRedlines(content, suggestions, selectedId);
    }
  } catch (error) {
    console.error('Error processing content with redlines:', error);
    return hasHtmlMarkup(content) ? content : convertTextToHtml(content);
  }
};

/**
 * Process plain text content with redline suggestions
 */
function processPlainTextContentWithRedlines(
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string {
  console.log('Processing plain text with redlines');
  
  // Convert to HTML first
  const htmlContent = convertTextToHtml(content);
  
  // Create text segments with suggestions
  const segments = createTextSegments(content, suggestions);
  
  console.log(`Created ${segments.length} text segments`);
  
  // Build the final HTML with redline markup
  let result = '';
  
  segments.forEach((segment, index) => {
    if (segment.suggestion) {
      // This segment has a suggestion - apply redline markup
      const isSelected = segment.suggestion.id === selectedId;
      const redlineSpan = createRedlineSpan(segment.suggestion, segment.text, isSelected);
      result += redlineSpan;
      
      console.log(`Applied redline to segment ${index}: "${segment.text.substring(0, 20)}..."`);
    } else {
      // Regular text segment
      result += escapeHtml(segment.text);
    }
  });
  
  // Wrap in basic HTML structure
  const finalResult = `<div class="redline-content">${result}</div>`;
  
  console.log('Redline processing complete, result length:', finalResult.length);
  return finalResult;
}

/**
 * Create text segments from content and suggestions
 */
function createTextSegments(
  content: string,
  suggestions: RedlineSuggestion[]
): TextSegment[] {
  console.log('Creating text segments from content and suggestions');
  
  // Validate and sort suggestions
  const validSuggestions = suggestions
    .filter(s => validateSuggestionForMarkup(s, content.length))
    .sort((a, b) => a.startPos - b.startPos);
  
  console.log(`Using ${validSuggestions.length} valid suggestions out of ${suggestions.length}`);
  
  const segments: TextSegment[] = [];
  let currentPos = 0;
  
  validSuggestions.forEach((suggestion, index) => {
    // Add text before this suggestion
    if (currentPos < suggestion.startPos) {
      const beforeText = content.substring(currentPos, suggestion.startPos);
      if (beforeText.length > 0) {
        segments.push({
          start: currentPos,
          end: suggestion.startPos,
          text: beforeText
        });
      }
    }
    
    // Add the suggestion segment
    const suggestionText = content.substring(suggestion.startPos, suggestion.endPos);
    segments.push({
      start: suggestion.startPos,
      end: suggestion.endPos,
      text: suggestionText,
      suggestion: suggestion
    });
    
    currentPos = suggestion.endPos;
    
    console.log(`Added suggestion segment ${index}: pos ${suggestion.startPos}-${suggestion.endPos}`);
  });
  
  // Add remaining text
  if (currentPos < content.length) {
    const remainingText = content.substring(currentPos);
    if (remainingText.length > 0) {
      segments.push({
        start: currentPos,
        end: content.length,
        text: remainingText
      });
    }
  }
  
  return segments;
}

interface TextSegment {
  start: number;
  end: number;
  text: string;
  suggestion?: RedlineSuggestion;
  isHtml?: boolean;
}
