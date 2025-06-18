
/**
 * HTML Utilities
 * 
 * Purpose: HTML manipulation and validation utilities
 */

/**
 * Escapes HTML characters to prevent XSS
 */
export const escapeHtml = (text: string): string => {
  const div = window.document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Detects if content contains HTML markup
 */
export const hasHtmlMarkup = (content: string): boolean => {
  return /<[^>]+>/.test(content);
};

/**
 * Detects if content contains redline markup specifically
 */
export const hasRedlineMarkup = (content: string): boolean => {
  return /class="redline-suggestion/.test(content);
};

/**
 * Converts plain text to HTML while preserving paragraph structure
 */
export const convertTextToHtml = (content: string): string => {
  console.log('Converting text to HTML, preserving paragraph structure');
  
  // If content already contains redline markup, it should already be in HTML format
  if (hasRedlineMarkup(content)) {
    console.log('Content contains redline markup, preserving as-is');
    return content;
  }
  
  // If content already contains HTML markup, return it as-is
  if (hasHtmlMarkup(content)) {
    console.log('Content already contains HTML markup, preserving structure');
    return content;
  }
  
  // Plain text - convert preserving paragraph structure
  console.log('Converting plain text to HTML with proper paragraph handling');
  
  // First, split on double line breaks to identify paragraphs
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
 * Validates and cleans up HTML content
 */
export const validateHtml = (content: string): string => {
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
