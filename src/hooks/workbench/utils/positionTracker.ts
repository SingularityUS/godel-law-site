
/**
 * Position Tracker Utility
 * 
 * Purpose: Tracks character positions between original and cleaned text for redlining support
 */

export interface PositionMapping {
  originalPos: number;
  cleanedPos: number;
  length: number;
}

export interface ParagraphPosition {
  originalStart: number;
  originalEnd: number;
  cleanedStart: number;
  cleanedEnd: number;
  paragraphId: string;
}

export interface DocumentPositionMap {
  characterMap: PositionMapping[];
  paragraphBoundaries: ParagraphPosition[];
  totalOriginalLength: number;
  totalCleanedLength: number;
}

/**
 * Creates a position mapping between original and cleaned text
 */
export const createPositionMap = (originalText: string, cleanedText: string): DocumentPositionMap => {
  const characterMap: PositionMapping[] = [];
  const paragraphBoundaries: ParagraphPosition[] = [];
  
  let originalPos = 0;
  let cleanedPos = 0;
  let currentParagraph = 1;
  let paragraphStartOriginal = 0;
  let paragraphStartCleaned = 0;
  
  // Track character-by-character mapping
  for (let i = 0; i < originalText.length; i++) {
    const originalChar = originalText[i];
    
    // Check if this character was removed during cleaning
    if (cleanedPos < cleanedText.length && cleanedText[cleanedPos] === originalChar) {
      // Character preserved - create 1:1 mapping
      characterMap.push({
        originalPos: i,
        cleanedPos: cleanedPos,
        length: 1
      });
      cleanedPos++;
    } else {
      // Character was removed - map to previous position
      characterMap.push({
        originalPos: i,
        cleanedPos: Math.max(0, cleanedPos - 1),
        length: 0
      });
    }
    
    // Track paragraph boundaries
    if (originalChar === '\n' && originalText[i + 1] === '\n') {
      // Double newline indicates paragraph break
      paragraphBoundaries.push({
        originalStart: paragraphStartOriginal,
        originalEnd: i,
        cleanedStart: paragraphStartCleaned,
        cleanedEnd: cleanedPos - 1,
        paragraphId: `para-${currentParagraph}`
      });
      
      currentParagraph++;
      paragraphStartOriginal = i + 2;
      paragraphStartCleaned = cleanedPos + 1;
    }
  }
  
  // Add final paragraph if text doesn't end with double newline
  if (paragraphStartOriginal < originalText.length) {
    paragraphBoundaries.push({
      originalStart: paragraphStartOriginal,
      originalEnd: originalText.length - 1,
      cleanedStart: paragraphStartCleaned,
      cleanedEnd: cleanedText.length - 1,
      paragraphId: `para-${currentParagraph}`
    });
  }
  
  return {
    characterMap,
    paragraphBoundaries,
    totalOriginalLength: originalText.length,
    totalCleanedLength: cleanedText.length
  };
};

/**
 * Maps a position from cleaned text back to original text
 */
export const mapCleanedToOriginal = (cleanedPos: number, positionMap: DocumentPositionMap): number => {
  // Find the mapping entry for this cleaned position
  const mapping = positionMap.characterMap.find(m => m.cleanedPos === cleanedPos);
  return mapping ? mapping.originalPos : cleanedPos;
};

/**
 * Maps a position from original text to cleaned text
 */
export const mapOriginalToCleaned = (originalPos: number, positionMap: DocumentPositionMap): number => {
  const mapping = positionMap.characterMap[originalPos];
  return mapping ? mapping.cleanedPos : originalPos;
};

/**
 * Gets paragraph boundaries for a given paragraph ID
 */
export const getParagraphBoundaries = (paragraphId: string, positionMap: DocumentPositionMap): ParagraphPosition | undefined => {
  return positionMap.paragraphBoundaries.find(p => p.paragraphId === paragraphId);
};
