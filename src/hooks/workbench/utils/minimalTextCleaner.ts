
/**
 * Minimal Text Cleaner
 * 
 * Purpose: Performs minimal cleaning while preserving document structure for redlining
 */

export interface CleaningResult {
  originalContent: string;
  processableContent: string;
  cleaningApplied: string[];
}

/**
 * Performs minimal cleaning that only removes characters that break AI processing
 * while preserving all document structure for future redlining support
 */
export const performMinimalCleaning = (text: string): CleaningResult => {
  if (!text || typeof text !== 'string') {
    return {
      originalContent: '',
      processableContent: '',
      cleaningApplied: ['empty-input']
    };
  }

  const originalContent = text;
  const cleaningApplied: string[] = [];
  let processableContent = text;

  // Only perform absolutely necessary cleaning for AI processing
  
  // 1. Normalize line endings (this is safe and doesn't affect positioning much)
  if (processableContent.includes('\r\n') || processableContent.includes('\r')) {
    processableContent = processableContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaningApplied.push('normalized-line-endings');
  }

  // 2. Remove null bytes and other control characters that break JSON parsing
  const originalLength = processableContent.length;
  processableContent = processableContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (processableContent.length !== originalLength) {
    cleaningApplied.push('removed-control-characters');
  }

  // 3. Remove zero-width characters that can cause parsing issues
  const beforeZeroWidth = processableContent.length;
  processableContent = processableContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (processableContent.length !== beforeZeroWidth) {
    cleaningApplied.push('removed-zero-width-characters');
  }

  // That's it! We preserve:
  // - All spaces and tabs (important for legal document formatting)
  // - All line breaks and paragraph structure
  // - All special characters and punctuation
  // - All formatting that doesn't break AI processing

  console.log('Minimal cleaning applied:', cleaningApplied);
  console.log(`Content length: ${originalContent.length} → ${processableContent.length}`);

  return {
    originalContent,
    processableContent,
    cleaningApplied
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
