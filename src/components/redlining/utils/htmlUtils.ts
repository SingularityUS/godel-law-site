
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
