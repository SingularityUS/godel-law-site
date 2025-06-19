
/**
 * Content Processor
 * 
 * Purpose: Processes content while preserving original HTML structure and text
 */

import { RedlineSuggestion } from "@/types/redlining";
import { hasHtmlMarkup, convertTextToHtml } from "./htmlUtils";
import { createRedlineSpan, validateSuggestionForMarkup, createPlainTextSpan } from "./markupGenerators";
import { createPositionMapping, mapPlainTextToHtml, extractPlainText } from "./positionMapping";

interface TextSegment {
  start: number;
  end: number;
  text: string;
  suggestion?: RedlineSuggestion;
  isHtml?: boolean;
}

/**
 * Processes content by preserving original HTML structure and adding redline overlays
 */
export const processContentWithRedlines = (
  content: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('Processing content with redlines - preserving HTML structure');
  console.log(`Content length: ${content.length}, Suggestions: ${suggestions.length}`);
  console.log('Content preview:', content.substring(0, 200));
  
  if (!content || content.trim().length === 0) {
    return '<p>No content available</p>';
  }
  
  if (suggestions.length === 0) {
    console.log('No suggestions to process, returning original content');
    return hasHtmlMarkup(content) ? content : convertTextToHtml(content);
  }
  
  // Check if content is HTML or plain text
  const isHtmlContent = hasHtmlMarkup(content);
  console.log('Content type:', isHtmlContent ? 'HTML' : 'Plain text');
  
  if (isHtmlContent) {
    // For HTML content, we need to map suggestion positions to HTML positions
    return processHtmlContentWithRedlines(content, suggestions, selectedId);
  } else {
    // For plain text, convert to HTML first then process
    const htmlContent = convertTextToHtml(content);
    return processPlainTextContentWithRedlines(content, htmlContent, suggestions, selectedId);
  }
};

/**
 * Processes HTML content while preserving its structure
 */
const processHtmlContentWithRedlines = (
  htmlContent: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('Processing HTML content with redlines');
  
  // Extract plain text for position calculations
  const plainText = extractPlainText(htmlContent);
  console.log('Extracted plain text length:', plainText.length);
  
  // Create position mapping between plain text and HTML
  const positionMapping = createPositionMapping(htmlContent);
  console.log('Created position mapping with', positionMapping.length, 'entries');
  
  // Filter and validate suggestions against plain text
  const validSuggestions = suggestions.filter(s => {
    const isValid = validateSuggestionForMarkup(s, plainText.length);
    if (!isValid) {
      console.warn(`Invalid suggestion ${s.id}:`, {
        startPos: s.startPos,
        endPos: s.endPos,
        textLength: plainText.length,
        originalText: s.originalText
      });
    }
    return isValid;
  });
  
  console.log(`Found ${validSuggestions.length} valid suggestions out of ${suggestions.length}`);
  
  if (validSuggestions.length === 0) {
    console.log('No valid suggestions, returning original HTML content');
    return htmlContent;
  }
  
  // Apply suggestions to HTML content
  return applyRedlinesToHtml(htmlContent, plainText, validSuggestions, positionMapping, selectedId);
};

/**
 * Processes plain text content after converting to HTML
 */
const processPlainTextContentWithRedlines = (
  originalText: string,
  htmlContent: string,
  suggestions: RedlineSuggestion[],
  selectedId: string | null
): string => {
  console.log('Processing plain text content with redlines');
  
  // Filter and validate suggestions
  const validSuggestions = suggestions.filter(s => 
    validateSuggestionForMarkup(s, originalText.length)
  );
  
  if (validSuggestions.length === 0) {
    console.log('No valid suggestions for plain text, returning HTML content');
    return htmlContent;
  }
  
  // Create text segments with original text preserved
  const segments = createTextSegments(originalText, validSuggestions);
  
  // Generate HTML with redline markup
  const processedContent = segments
    .map(segment => {
      if (segment.suggestion) {
        const isSelected = selectedId === segment.suggestion.id;
        return createRedlineSpan(segment.suggestion, segment.text, isSelected);
      } else {
        return createPlainTextSpan(segment.text);
      }
    })
    .join('');
  
  // Convert to proper HTML structure
  return convertTextToHtml(processedContent);
};

/**
 * Applies redline suggestions to HTML content while preserving structure
 */
const applyRedlinesToHtml = (
  htmlContent: string,
  plainText: string,
  suggestions: RedlineSuggestion[],
  positionMapping: any[],
  selectedId: string | null
): string => {
  console.log('Applying redlines to HTML content');
  
  // Sort suggestions by position to avoid conflicts
  const sortedSuggestions = [...suggestions].sort((a, b) => a.startPos - b.startPos);
  
  let processedContent = htmlContent;
  let offset = 0; // Track how much the content has grown due to added markup
  
  for (const suggestion of sortedSuggestions) {
    try {
      // Find the text in the HTML content
      const searchText = suggestion.originalText.trim();
      if (!searchText) continue;
      
      // Look for the text starting from the expected position
      const searchStartPos = Math.max(0, mapPlainTextToHtml(suggestion.startPos, positionMapping) + offset);
      const textIndex = processedContent.indexOf(searchText, searchStartPos);
      
      if (textIndex === -1) {
        console.warn(`Could not find suggestion text "${searchText}" in HTML content`);
        continue;
      }
      
      // Create the redline span
      const isSelected = selectedId === suggestion.id;
      const redlineSpan = createRedlineSpan(suggestion, searchText, isSelected);
      
      // Replace the text with the redline span
      const beforeText = processedContent.substring(0, textIndex);
      const afterText = processedContent.substring(textIndex + searchText.length);
      processedContent = beforeText + redlineSpan + afterText;
      
      // Update offset to account for the added markup
      offset += redlineSpan.length - searchText.length;
      
      console.log(`Applied suggestion ${suggestion.id} at position ${textIndex}`);
    } catch (error) {
      console.warn(`Error applying suggestion ${suggestion.id}:`, error);
    }
  }
  
  console.log('Finished applying redlines to HTML content');
  return processedContent;
};

/**
 * Creates text segments that preserve original text structure
 */
const createTextSegments = (
  text: string, 
  suggestions: RedlineSuggestion[]
): TextSegment[] => {
  // Remove overlapping suggestions - keep the first one encountered
  const resolvedSuggestions = resolveOverlaps(suggestions);
  
  // Sort suggestions by position
  const sortedSuggestions = resolvedSuggestions.sort((a, b) => a.startPos - b.startPos);
  
  const segments: TextSegment[] = [];
  let currentPos = 0;
  
  for (const suggestion of sortedSuggestions) {
    // Add text before suggestion (if any)
    if (currentPos < suggestion.startPos) {
      segments.push({
        start: currentPos,
        end: suggestion.startPos,
        text: text.substring(currentPos, suggestion.startPos)
      });
    }
    
    // Add suggestion segment with original text preserved
    const originalText = text.substring(suggestion.startPos, suggestion.endPos);
    segments.push({
      start: suggestion.startPos,
      end: suggestion.endPos,
      text: originalText,
      suggestion: suggestion
    });
    
    currentPos = suggestion.endPos;
  }
  
  // Add remaining text after last suggestion
  if (currentPos < text.length) {
    segments.push({
      start: currentPos,
      end: text.length,
      text: text.substring(currentPos)
    });
  }
  
  return segments;
};

/**
 * Resolves overlapping suggestions by keeping the first one
 */
const resolveOverlaps = (suggestions: RedlineSuggestion[]): RedlineSuggestion[] => {
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
