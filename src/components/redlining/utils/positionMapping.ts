
/**
 * Position Mapping Utilities
 * 
 * Purpose: Maps positions between plain text and HTML content for redline suggestions
 */

export interface PositionMap {
  plainTextPos: number;
  htmlPos: number;
  isInsideTag: boolean;
}

/**
 * Creates a mapping between plain text positions and HTML positions
 */
export const createPositionMapping = (htmlContent: string): PositionMap[] => {
  const mapping: PositionMap[] = [];
  let plainTextPos = 0;
  let htmlPos = 0;
  let insideTag = false;
  
  while (htmlPos < htmlContent.length) {
    const char = htmlContent[htmlPos];
    
    if (char === '<') {
      insideTag = true;
    } else if (char === '>') {
      insideTag = false;
      htmlPos++;
      continue;
    }
    
    if (!insideTag) {
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
 * Maps a plain text position to HTML position
 */
export const mapPlainTextToHtml = (plainTextPos: number, mapping: PositionMap[]): number => {
  const mappingEntry = mapping.find(m => m.plainTextPos === plainTextPos);
  return mappingEntry ? mappingEntry.htmlPos : plainTextPos;
};

/**
 * Maps an HTML position to plain text position
 */
export const mapHtmlToPlainText = (htmlPos: number, mapping: PositionMap[]): number => {
  const mappingEntry = mapping.find(m => m.htmlPos === htmlPos);
  return mappingEntry ? mappingEntry.plainTextPos : htmlPos;
};

/**
 * Extracts plain text from HTML content
 */
export const extractPlainText = (htmlContent: string): string => {
  const div = document.createElement('div');
  div.innerHTML = htmlContent;
  return div.textContent || '';
};

/**
 * Finds text in HTML content using text-based matching as fallback
 */
export const findTextInHtml = (htmlContent: string, searchText: string, startFromPos: number = 0): { start: number; end: number } | null => {
  const plainText = extractPlainText(htmlContent);
  const textIndex = plainText.indexOf(searchText, startFromPos);
  
  if (textIndex === -1) {
    return null;
  }
  
  const mapping = createPositionMapping(htmlContent);
  const htmlStart = mapPlainTextToHtml(textIndex, mapping);
  const htmlEnd = mapPlainTextToHtml(textIndex + searchText.length, mapping);
  
  return { start: htmlStart, end: htmlEnd };
};
