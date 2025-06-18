
/**
 * Redline Markup Utilities
 * 
 * Purpose: Utility functions for processing redline markup
 */

import { RedlineSuggestion } from "@/types/redlining";

/**
 * Escapes HTML characters to prevent XSS
 */
export const escapeHtml = (text: string): string => {
  const div = window.document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const getSeverityClass = (severity: string): string => {
  switch (severity) {
    case 'high': return 'severity-high';
    case 'medium': return 'severity-medium';
    case 'low': return 'severity-low';
    default: return 'severity-medium';
  }
};

export const getTypeClass = (type: string): string => {
  switch (type) {
    case 'grammar': return 'type-grammar';
    case 'style': return 'type-style';
    case 'legal': return 'type-legal';
    case 'clarity': return 'type-clarity';
    default: return 'type-grammar';
  }
};

export const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'grammar': return '✓';
    case 'style': return '✦';
    case 'legal': return '⚖';
    case 'clarity': return '💡';
    default: return '✓';
  }
};

/**
 * Detects if content contains HTML markup
 */
const hasHtmlMarkup = (content: string): boolean => {
  return /<[^>]+>/.test(content);
};

/**
 * Converts plain text to HTML while preserving existing HTML markup
 */
export const convertTextToHtml = (content: string): string => {
  console.log('Converting text to HTML, preserving existing markup');
  
  // If content already contains HTML markup, return it as-is
  if (hasHtmlMarkup(content)) {
    console.log('Content already contains HTML markup, preserving structure');
    return content;
  }
  
  // Plain text - convert line breaks to paragraphs
  console.log('Converting plain text to HTML paragraphs');
  return content
    .split('\n')
    .map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') {
        return '<br>';
      }
      return `<p>${trimmedLine}</p>`;
    })
    .join('');
};

/**
 * Validates and cleans up HTML content
 */
const validateHtml = (content: string): string => {
  try {
    // Create a temporary div to validate HTML structure
    const div = document.createElement('div');
    div.innerHTML = content;
    
    // Return the cleaned HTML
    return div.innerHTML;
  } catch (error) {
    console.warn('HTML validation failed, returning original content:', error);
    return content;
  }
};

/**
 * Injects redline markup into content
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
  
  let enhancedContent = content;
  
  // Sort suggestions by position (reverse order to maintain positions)
  const validSuggestions = suggestions.filter(s => 
    s.status === 'pending' && 
    s.startPos !== undefined && 
    s.endPos !== undefined &&
    s.startPos >= 0 && 
    s.endPos <= content.length &&
    s.startPos < s.endPos
  );
  
  console.log(`Applying ${validSuggestions.length} valid suggestions`);
  
  const sortedSuggestions = [...validSuggestions].sort((a, b) => b.startPos - a.startPos);
  
  sortedSuggestions.forEach((suggestion, index) => {
    try {
      const beforeText = enhancedContent.substring(0, suggestion.startPos);
      const originalText = enhancedContent.substring(suggestion.startPos, suggestion.endPos);
      const afterText = enhancedContent.substring(suggestion.endPos);
      
      // Validate that we're highlighting the expected text
      const expectedText = suggestion.originalText;
      if (expectedText && originalText.trim() !== expectedText.trim()) {
        console.warn(`Text mismatch for suggestion ${suggestion.id}: expected "${expectedText}" but found "${originalText}"`);
      }
      
      const isSelected = selectedId === suggestion.id;
      const severityClass = getSeverityClass(suggestion.severity);
      const typeClass = getTypeClass(suggestion.type);
      
      const redlineMarkup = `<span class="redline-suggestion ${severityClass} ${typeClass} ${isSelected ? 'selected' : ''}" data-suggestion-id="${suggestion.id}" data-type="${suggestion.type}" data-severity="${suggestion.severity}" title="${escapeHtml(suggestion.explanation)}"><span class="original-text">${escapeHtml(originalText)}</span><span class="suggested-text">${escapeHtml(suggestion.suggestedText)}</span><span class="redline-indicator">${getTypeIcon(suggestion.type)}</span></span>`;
      
      enhancedContent = beforeText + redlineMarkup + afterText;
      
      console.log(`Applied suggestion ${index + 1}/${sortedSuggestions.length}: "${originalText.substring(0, 30)}..."`);
      
    } catch (error) {
      console.error(`Error applying suggestion ${suggestion.id}:`, error);
    }
  });
  
  // Convert plain text formatting to HTML while preserving redlines
  const finalContent = convertTextToHtml(enhancedContent);
  
  // Validate the final HTML structure
  const validatedContent = validateHtml(finalContent);
  
  console.log('Redline markup injection complete');
  return validatedContent;
};
