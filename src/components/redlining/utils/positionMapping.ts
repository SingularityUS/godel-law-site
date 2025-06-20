
/**
 * Position Mapping Utilities
 * 
 * Purpose: Enhanced position mapping with content source validation
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
  
  console.log('🗺️ CREATING POSITION MAPPING:', {
    htmlContentLength: htmlContent.length,
    hasHtmlTags: htmlContent.includes('<'),
    preview: htmlContent.substring(0, 100) + '...'
  });
  
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
  
  console.log('✅ Position mapping created:', {
    mappingEntries: mapping.length,
    plainTextLength: plainTextPos,
    htmlLength: htmlContent.length,
    compressionRatio: plainTextPos / htmlContent.length
  });
  
  return mapping;
};

/**
 * Finds text in HTML content with enhanced content source validation
 */
export const findTextInHtml = (
  htmlContent: string, 
  searchText: string, 
  startFromPos: number = 0,
  expectedStartPos?: number
): { start: number; end: number } | null => {
  const cleanSearchText = searchText.trim();
  if (!cleanSearchText) return null;
  
  console.log(`🔍 FINDING TEXT IN HTML (CONTENT SOURCE VALIDATION):`, {
    searchText: cleanSearchText,
    searchLength: cleanSearchText.length,
    htmlLength: htmlContent.length,
    startFromPos,
    expectedStartPos,
    htmlPreview: htmlContent.substring(startFromPos, startFromPos + 100) + '...'
  });
  
  // If we have an expected position, validate it first
  if (typeof expectedStartPos === 'number' && expectedStartPos >= 0) {
    const expectedEnd = expectedStartPos + cleanSearchText.length;
    if (expectedEnd <= htmlContent.length) {
      const textAtExpectedPos = htmlContent.substring(expectedStartPos, expectedEnd);
      if (textAtExpectedPos === cleanSearchText) {
        console.log('✅ VALIDATED EXPECTED POSITION:', {
          expectedStartPos,
          expectedEnd,
          actualText: textAtExpectedPos,
          matches: true
        });
        return { start: expectedStartPos, end: expectedEnd };
      } else {
        console.warn('⚠️ EXPECTED POSITION MISMATCH:', {
          expectedStartPos,
          expectedEnd,
          expectedText: cleanSearchText,
          actualText: textAtExpectedPos
        });
      }
    }
  }
  
  // Try direct HTML search first
  const directIndex = htmlContent.indexOf(cleanSearchText, startFromPos);
  if (directIndex !== -1) {
    console.log('✅ Found text directly:', {
      position: directIndex,
      actualText: htmlContent.substring(directIndex, directIndex + cleanSearchText.length),
      matchesExpected: htmlContent.substring(directIndex, directIndex + cleanSearchText.length) === cleanSearchText
    });
    return { start: directIndex, end: directIndex + cleanSearchText.length };
  }
  
  // Try case-insensitive search
  const lowerHtml = htmlContent.toLowerCase();
  const lowerSearch = cleanSearchText.toLowerCase();
  const caseInsensitiveIndex = lowerHtml.indexOf(lowerSearch, startFromPos);
  if (caseInsensitiveIndex !== -1) {
    console.log('✅ Found text case-insensitively:', {
      position: caseInsensitiveIndex,
      actualText: htmlContent.substring(caseInsensitiveIndex, caseInsensitiveIndex + cleanSearchText.length)
    });
    return { start: caseInsensitiveIndex, end: caseInsensitiveIndex + cleanSearchText.length };
  }
  
  // Try partial matching for citations that might span elements
  const words = cleanSearchText.split(/\s+/).filter(word => word.length > 2);
  if (words.length >= 2) {
    console.log('🔍 Trying partial word matching:', words);
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
          console.log('✅ Found full text in context:', {
            position: actualStart,
            actualText: htmlContent.substring(actualStart, actualStart + cleanSearchText.length)
          });
          return { start: actualStart, end: actualStart + cleanSearchText.length };
        }
      }
    }
  }
  
  // Try mapping approach as last resort
  try {
    const plainText = extractPlainText(htmlContent);
    console.log('🔍 Trying position mapping approach:', {
      plainTextLength: plainText.length,
      plainTextPreview: plainText.substring(0, 100) + '...'
    });
    
    const textIndex = plainText.indexOf(cleanSearchText);
    
    if (textIndex !== -1) {
      const mapping = createPositionMapping(htmlContent);
      const htmlStart = mapPlainTextToHtml(textIndex, mapping);
      const htmlEnd = mapPlainTextToHtml(textIndex + cleanSearchText.length, mapping);
      
      if (htmlStart < htmlContent.length && htmlEnd <= htmlContent.length) {
        console.log('✅ Found text via position mapping:', {
          plainTextIndex: textIndex,
          htmlStart,
          htmlEnd,
          actualText: htmlContent.substring(htmlStart, htmlEnd)
        });
        return { start: htmlStart, end: htmlEnd };
      }
    }
  } catch (error) {
    console.warn('Position mapping failed for text search:', error);
  }
  
  console.error('❌ Could not find text:', {
    searchText: cleanSearchText,
    searchLength: cleanSearchText.length,
    htmlLength: htmlContent.length,
    startPos: startFromPos,
    expectedPos: expectedStartPos
  });
  return null;
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
 * Validates that a position range contains the expected text with content source info
 */
export const validatePositionRange = (
  content: string,
  startPos: number,
  endPos: number,
  expectedText: string,
  contentSource?: string
): boolean => {
  if (startPos < 0 || endPos > content.length || startPos >= endPos) {
    console.error('❌ INVALID POSITION RANGE:', {
      startPos,
      endPos,
      contentLength: content.length,
      rangeLength: endPos - startPos,
      contentSource: contentSource || 'unknown',
      contentPreview: content.substring(Math.max(0, startPos - 20), Math.min(content.length, endPos + 20))
    });
    return false;
  }
  
  const actualText = content.substring(startPos, endPos);
  const matches = actualText === expectedText;
  
  if (!matches) {
    console.error('❌ POSITION VALIDATION FAILED:', {
      expected: expectedText,
      actual: actualText,
      startPos,
      endPos,
      expectedLength: expectedText.length,
      actualLength: actualText.length,
      contentSource: contentSource || 'unknown',
      contentPreview: content.substring(Math.max(0, startPos - 20), Math.min(content.length, endPos + 20))
    });
  } else {
    console.log('✅ POSITION VALIDATION PASSED:', {
      text: expectedText,
      startPos,
      endPos,
      contentSource: contentSource || 'unknown'
    });
  }
  
  return matches;
};
