
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
  
  console.log('Creating position mapping for HTML content of length:', htmlContent.length);
  
  while (htmlPos < htmlContent.length) {
    const char = htmlContent[htmlPos];
    
    // Handle HTML entities (like &nbsp;, &amp;, etc.)
    if (char === '&' && !insideTag) {
      insideEntity = true;
      htmlPos++;
      continue;
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
      htmlPos++;
      continue;
    } else if (char === '>' && insideTag) {
      insideTag = false;
      htmlPos++;
      continue;
    } else if (insideTag) {
      htmlPos++;
      continue;
    }
    
    // Map visible characters (not inside tags or entities)
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
  
  console.log(`Created position mapping with ${mapping.length} entries for ${plainTextPos} plain text characters`);
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
 * Finds text in HTML content using improved text-based matching with position validation
 */
export const findTextInHtml = (
  htmlContent: string, 
  searchText: string, 
  startFromPos: number = 0
): { start: number; end: number } | null => {
  const cleanSearchText = searchText.trim();
  if (!cleanSearchText) return null;
  
  console.log(`Finding text in HTML: "${cleanSearchText}" starting from position ${startFromPos}`);
  
  // Try direct HTML search first
  const directIndex = htmlContent.indexOf(cleanSearchText, startFromPos);
  if (directIndex !== -1) {
    console.log(`Found text directly at position ${directIndex}`);
    return { start: directIndex, end: directIndex + cleanSearchText.length };
  }
  
  // Try case-insensitive search
  const lowerHtml = htmlContent.toLowerCase();
  const lowerSearch = cleanSearchText.toLowerCase();
  const caseInsensitiveIndex = lowerHtml.indexOf(lowerSearch, startFromPos);
  if (caseInsensitiveIndex !== -1) {
    console.log(`Found text case-insensitively at position ${caseInsensitiveIndex}`);
    return { start: caseInsensitiveIndex, end: caseInsensitiveIndex + cleanSearchText.length };
  }
  
  // Try partial matching for citations that might span elements
  const words = cleanSearchText.split(/\s+/).filter(word => word.length > 2);
  if (words.length >= 2) {
    for (const word of words) {
      const wordIndex = htmlContent.indexOf(word, startFromPos);
      if (wordIndex !== -1) {
        console.log(`Found partial match for word "${word}" at position ${wordIndex}`);
        // Look for the full text around this position
        const contextStart = Math.max(0, wordIndex - 50);
        const contextEnd = Math.min(htmlContent.length, wordIndex + cleanSearchText.length + 50);
        const context = htmlContent.substring(contextStart, contextEnd);
        const contextIndex = context.indexOf(cleanSearchText);
        if (contextIndex !== -1) {
          const actualStart = contextStart + contextIndex;
          console.log(`Found full text in context at position ${actualStart}`);
          return { start: actualStart, end: actualStart + cleanSearchText.length };
        }
      }
    }
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
        console.log(`Found text via position mapping at ${htmlStart}-${htmlEnd}`);
        return { start: htmlStart, end: htmlEnd };
      }
    }
  } catch (error) {
    console.warn('Position mapping failed for text search:', error);
  }
  
  console.warn(`Could not find text: "${cleanSearchText}"`);
  return null;
};

/**
 * Validates that a position range contains the expected text
 */
export const validatePositionRange = (
  content: string,
  startPos: number,
  endPos: number,
  expectedText: string
): boolean => {
  if (startPos < 0 || endPos > content.length || startPos >= endPos) {
    console.warn(`Invalid position range: ${startPos}-${endPos} for content length ${content.length}`);
    return false;
  }
  
  const actualText = content.substring(startPos, endPos);
  const matches = actualText === expectedText;
  
  if (!matches) {
    console.warn(`Position validation failed:`, {
      expected: expectedText,
      actual: actualText,
      startPos,
      endPos
    });
  }
  
  return matches;
};
