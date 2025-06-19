
/**
 * HTML Utilities
 * 
 * Purpose: Enhanced HTML manipulation and validation utilities
 */

/**
 * Escapes HTML characters to prevent XSS with improved handling
 */
export const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Detects if content contains HTML markup with improved pattern matching
 */
export const hasHtmlMarkup = (content: string): boolean => {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // Check for HTML tags
  const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlTagPattern.test(content);
};

/**
 * Detects if content contains redline markup specifically
 */
export const hasRedlineMarkup = (content: string): boolean => {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  return /class="[^"]*redline-suggestion[^"]*"/.test(content);
};

/**
 * Extracts plain text from HTML content
 */
export const extractPlainText = (htmlContent: string): string => {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }
  
  try {
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    
    // Get the text content (this automatically strips HTML tags)
    return div.textContent || div.innerText || '';
  } catch (error) {
    console.warn('Failed to extract plain text from HTML:', error);
    // Fallback: simple regex-based HTML tag removal
    return htmlContent.replace(/<[^>]*>/g, '');
  }
};

/**
 * Converts plain text to HTML while preserving paragraph structure
 */
export const convertTextToHtml = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '<p>No content available</p>';
  }
  
  console.log('Converting text to HTML, preserving paragraph structure');
  
  // If content already contains redline markup, preserve it
  if (hasRedlineMarkup(content)) {
    console.log('Content contains redline markup, preserving as-is');
    return content;
  }
  
  // If content already contains HTML markup, return it as-is
  if (hasHtmlMarkup(content)) {
    console.log('Content already contains HTML markup, preserving structure');
    return content;
  }
  
  // Convert plain text to HTML paragraphs
  console.log('Converting plain text to HTML with proper paragraph handling');
  
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return '<p>No content available</p>';
  }
  
  // Split on double line breaks to identify paragraphs
  const paragraphs = trimmedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) {
    return '<p>No content available</p>';
  }
  
  return paragraphs
    .map(paragraph => {
      const trimmedParagraph = paragraph.trim();
      // Within each paragraph, convert single line breaks to <br> tags
      const paragraphWithBreaks = trimmedParagraph.replace(/\n/g, '<br>');
      return `<p>${paragraphWithBreaks}</p>`;
    })
    .join('');
};

/**
 * Validates and cleans up HTML content with improved error handling
 */
export const validateHtml = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '<p>No content available</p>';
  }
  
  try {
    // Create a temporary div to validate HTML structure
    const div = document.createElement('div');
    div.innerHTML = content;
    
    // Check if the HTML was parsed correctly
    if (div.innerHTML.length === 0 && content.length > 0) {
      console.warn('HTML validation resulted in empty content, returning original');
      return content;
    }
    
    // Return the cleaned HTML
    return div.innerHTML;
  } catch (error) {
    console.warn('HTML validation failed, returning original content:', error);
    return content;
  }
};

/**
 * Removes any existing redline markup from content
 */
export const stripRedlineMarkup = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  try {
    // Create a temporary div to validate HTML structure
    const div = document.createElement('div');
    div.innerHTML = content;
    
    // Find all redline suggestion elements
    const redlineElements = div.querySelectorAll('.redline-suggestion');
    redlineElements.forEach(element => {
      // Replace with just the original text
      const originalText = element.getAttribute('data-original') || element.textContent || '';
      element.outerHTML = originalText;
    });
    
    return div.innerHTML;
  } catch (error) {
    console.warn('Failed to strip redline markup:', error);
    return content;
  }
};
