
/**
 * Position Mapping Utilities
 * 
 * Purpose: Enhanced position mapping between plain text and HTML content
 */

export interface PositionMap {
  plainTextPos: number;
  htmlPos: number;
  isInsideTag: boolean;
}

/**
 * Creates a robust mapping between plain text positions and HTML positions
 */
export const createPositionMapping = (htmlContent: string): PositionMap[] => {
  const mapping: PositionMap[] = [];
  let plainTextPos = 0;
  let htmlPos = 0;
  let insideTag = false;
  let insideEntity = false;
  
  while (htmlPos < htmlContent.length) {
    const char = htmlContent[htmlPos];
    const nextChar = htmlContent[htmlPos + 1] || '';
    
    // Handle HTML entities
    if (char === '&' && !insideTag) {
      insideEntity = true;
    } else if (insideEntity && char === ';') {
      insideEntity = false;
      // Count entity as single character in plain text
      mapping.push({
        plainTextPos,
        htmlPos: htmlPos + 1,
        isInsideTag: false
      });
      plainTextPos++;
      htmlPos++;
      continue;
    } else if (insideEntity) {
      htmlPos++;
      continue;
    }
    
    // Handle HTML tags
    if (char === '<' && !insideEntity) {
      insideTag = true;
    } else if (char === '>' && insideTag) {
      insideTag = false;
      htmlPos++;
      continue;
    }
    
    // Map visible characters
    if (!insideTag && !insideEntity) {
      mapping.push({
        plainTextPos,
        htmlPos,
        isInsideTag: false
      });
      plainTextPos++;
    }
    
    htmlPos++;
  }
  
  return mapping;
};

/**
 * Maps a plain text position to HTML position with bounds checking
 */
export const mapPlainTextToHtml = (plainTextPos: number, mapping: PositionMap[]): number => {
  if (plainTextPos <= 0) return 0;
  if (plainTextPos >= mapping.length) return mapping[mapping.length - 1]?.htmlPos || 0;
  
  const mappingEntry = mapping[plainTextPos];
  return mappingEntry ? mappingEntry.htmlPos : plainTextPos;
};

/**
 * Maps an HTML position to plain text position with bounds checking
 */
export const mapHtmlToPlainText = (htmlPos: number, mapping: PositionMap[]): number => {
  const mappingEntry = mapping.find(m => m.htmlPos === htmlPos);
  return mappingEntry ? mappingEntry.plainTextPos : 0;
};

/**
 * Extracts clean plain text from HTML content
 */
export const extractPlainText = (htmlContent: string): string => {
  try {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get text content and normalize whitespace
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    return textContent.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.warn('Failed to extract plain text from HTML, using fallback:', error);
    // Fallback: strip HTML tags with regex
    return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
};

/**
 * Finds text in HTML content using improved text-based matching
 */
export const findTextInHtml = (
  htmlContent: string, 
  searchText: string, 
  startFromPos: number = 0
): { start: number; end: number } | null => {
  const cleanSearchText = searchText.trim();
  if (!cleanSearchText) return null;
  
  // Try direct HTML search first
  const directIndex = htmlContent.indexOf(cleanSearchText, startFromPos);
  if (directIndex !== -1) {
    return { start: directIndex, end: directIndex + cleanSearchText.length };
  }
  
  // Try case-insensitive search
  const lowerHtml = htmlContent.toLowerCase();
  const lowerSearch = cleanSearchText.toLowerCase();
  const caseInsensitiveIndex = lowerHtml.indexOf(lowerSearch, startFromPos);
  if (caseInsensitiveIndex !== -1) {
    return { start: caseInsensitiveIndex, end: caseInsensitiveIndex + cleanSearchText.length };
  }
  
  // Try mapping approach as last resort
  try {
    const plainText = extractPlainText(htmlContent);
    const textIndex = plainText.indexOf(cleanSearchText);
    
    if (textIndex !== -1) {
      const mapping = createPositionMapping(htmlContent);
      const htmlStart = mapPlainTextToHtml(textIndex, mapping);
      const htmlEnd = mapPlainTextToHtml(textIndex + cleanSearchText.length, mapping);
      
      if (htmlStart < htmlContent.length && htmlEnd <= htmlContent.length) {
        return { start: htmlStart, end: htmlEnd };
      }
    }
  } catch (error) {
    console.warn('Position mapping failed for text search:', error);
  }
  
  return null;
};
