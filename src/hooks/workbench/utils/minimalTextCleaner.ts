
/**
 * Minimal Text Cleaner
 * 
 * Purpose: Performs controlled cleaning with separate streams for ChatGPT processing and redline display
 */

export interface CleaningResult {
  originalContent: string;
  processableContent: string;
  cleaningApplied: string[];
  whitespaceMap: WhitespaceMapping[];
}

export interface WhitespaceMapping {
  originalPos: number;
  processablePos: number;
  type: 'preserved' | 'normalized' | 'removed';
}

/**
 * Performs controlled cleaning with separate processing for ChatGPT and display
 */
export const performMinimalCleaning = (text: string): CleaningResult => {
  if (!text || typeof text !== 'string') {
    return {
      originalContent: '',
      processableContent: '',
      cleaningApplied: ['empty-input'],
      whitespaceMap: []
    };
  }

  const originalContent = text;
  const cleaningApplied: string[] = [];
  const whitespaceMap: WhitespaceMapping[] = [];
  let processableContent = text;

  console.log('Starting controlled whitespace management');
  console.log(`Original content length: ${originalContent.length}`);

  // Track character-by-character mapping for position alignment
  let originalPos = 0;
  let processablePos = 0;

  // 1. Remove null bytes and control characters that break JSON parsing
  const originalLength = processableContent.length;
  processableContent = processableContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (processableContent.length !== originalLength) {
    cleaningApplied.push('removed-control-characters');
  }

  // 2. Remove zero-width characters that can cause parsing issues
  const beforeZeroWidth = processableContent.length;
  processableContent = processableContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (processableContent.length !== beforeZeroWidth) {
    cleaningApplied.push('removed-zero-width-characters');
  }

  // 3. Normalize line endings for consistent ChatGPT processing
  if (processableContent.includes('\r\n') || processableContent.includes('\r')) {
    processableContent = processableContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaningApplied.push('normalized-line-endings');
  }

  // 4. Apply targeted whitespace normalization for ChatGPT while preserving structure
  const beforeWhitespace = processableContent.length;
  
  // Normalize excessive internal whitespace (3+ spaces become 2, preserving intentional formatting)
  processableContent = processableContent.replace(/[ \t]{3,}/g, '  ');
  
  // Normalize excessive line breaks (3+ newlines become 2, preserving paragraph breaks)
  processableContent = processableContent.replace(/\n{3,}/g, '\n\n');
  
  // Only trim extreme leading/trailing whitespace (more than 2 chars)
  const leadingWhitespace = processableContent.match(/^[\s\n]{3,}/);
  const trailingWhitespace = processableContent.match(/[\s\n]{3,}$/);
  
  if (leadingWhitespace) {
    processableContent = processableContent.replace(/^[\s\n]{3,}/, '\n');
    cleaningApplied.push('normalized-leading-whitespace');
  }
  
  if (trailingWhitespace) {
    processableContent = processableContent.replace(/[\s\n]{3,}$/, '\n');
    cleaningApplied.push('normalized-trailing-whitespace');
  }

  if (processableContent.length !== beforeWhitespace) {
    cleaningApplied.push('normalized-excessive-whitespace');
  }

  console.log('Controlled cleaning applied:', cleaningApplied);
  console.log(`Content length: ${originalContent.length} → ${processableContent.length}`);
  console.log('Formatting preserved for redline display, normalized for ChatGPT processing');

  return {
    originalContent,
    processableContent,
    cleaningApplied,
    whitespaceMap // For future position mapping enhancements
  };
};

/**
 * Validates that the cleaned content is safe for AI processing
 */
export const validateProcessableContent = (content: string): boolean => {
  try {
    // Test JSON serialization (common AI processing requirement)
    JSON.stringify({ test: content });
    
    // Check for problematic characters that could break AI
    const problematicChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
    if (problematicChars.test(content)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Content validation failed:', error);
    return false;
  }
};

/**
 * Creates enhanced position mapping between original and processable content
 */
export const createPositionMapping = (originalContent: string, processableContent: string): WhitespaceMapping[] => {
  const mapping: WhitespaceMapping[] = [];
  let originalPos = 0;
  let processablePos = 0;

  while (originalPos < originalContent.length && processablePos < processableContent.length) {
    if (originalContent[originalPos] === processableContent[processablePos]) {
      mapping.push({
        originalPos,
        processablePos,
        type: 'preserved'
      });
      originalPos++;
      processablePos++;
    } else {
      // Character was modified or removed
      mapping.push({
        originalPos,
        processablePos: Math.max(0, processablePos - 1),
        type: 'normalized'
      });
      originalPos++;
    }
  }

  return mapping;
};
