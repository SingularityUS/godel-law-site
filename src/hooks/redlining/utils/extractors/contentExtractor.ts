
/**
 * Content Extractor
 * 
 * Purpose: Enhanced content extraction with comprehensive position debugging
 */

export const extractOriginalContent = (moduleResult: any): string => {
  console.log('=== EXTRACTING ORIGINAL CONTENT (POSITION DEBUG) ===');
  console.log('Module result structure:', {
    hasMetadata: !!moduleResult.metadata,
    hasOriginalContent: !!moduleResult.originalContent,
    hasInput: !!moduleResult.input,
    hasContent: !!moduleResult.content,
    hasOutput: !!moduleResult.output,
    resultKeys: Object.keys(moduleResult || {})
  });
  
  // Direct content checks
  if (moduleResult.originalContent && typeof moduleResult.originalContent === 'string') {
    const content = moduleResult.originalContent.trim();
    if (content.length > 0) {
      console.log('✅ Found direct originalContent:', {
        length: content.length,
        preview: content.substring(0, 100) + '...',
        startsWithNewline: content.startsWith('\n'),
        endsWithNewline: content.endsWith('\n'),
        doubleNewlineCount: (content.match(/\n\n/g) || []).length
      });
      return content;
    }
  }
  
  // Check metadata for original content
  if (moduleResult.metadata?.originalContent && typeof moduleResult.metadata.originalContent === 'string') {
    const content = moduleResult.metadata.originalContent.trim();
    if (content.length > 0) {
      console.log('✅ Found metadata originalContent:', {
        length: content.length,
        preview: content.substring(0, 100) + '...',
        doubleNewlineCount: (content.match(/\n\n/g) || []).length
      });
      return content;
    }
  }
  
  // Check input data structures
  if (moduleResult.input) {
    console.log('🔍 CHECKING INPUT STRUCTURES:', Object.keys(moduleResult.input));
    
    // Check for content in input
    if (moduleResult.input.content && typeof moduleResult.input.content === 'string') {
      const content = moduleResult.input.content.trim();
      if (content.length > 0) {
        console.log('✅ Found input content:', {
          length: content.length,
          preview: content.substring(0, 100) + '...'
        });
        return content;
      }
    }
    
    // Check for paragraphs in input and reconstruct
    if (moduleResult.input.paragraphs && Array.isArray(moduleResult.input.paragraphs)) {
      const reconstructed = moduleResult.input.paragraphs
        .map((p: any) => p.content || '')
        .filter((content: string) => content.trim().length > 0)
        .join('\n\n');
      
      if (reconstructed.length > 0) {
        console.log('✅ Reconstructed from input paragraphs:', {
          paragraphCount: moduleResult.input.paragraphs.length,
          reconstructedLength: reconstructed.length,
          preview: reconstructed.substring(0, 100) + '...',
          doubleNewlineCount: (reconstructed.match(/\n\n/g) || []).length
        });
        return reconstructed;
      }
    }
  }
  
  // Check for analysis results that might contain content
  console.log('🔍 CHECKING ANALYSIS STRUCTURES');
  
  // Check output for content
  if (moduleResult.output) {
    const outputKeys = Object.keys(moduleResult.output);
    console.log('Output keys:', outputKeys);
    
    // Look for content in various output structures
    const contentKeys = ['content', 'originalContent', 'text', 'originalText', 'input'];
    for (const key of contentKeys) {
      if (moduleResult.output[key] && typeof moduleResult.output[key] === 'string') {
        const content = moduleResult.output[key].trim();
        if (content.length > 0) {
          console.log(`✅ Found content in output.${key}:`, {
            length: content.length,
            preview: content.substring(0, 100) + '...'
          });
          return content;
        }
      }
    }
    
    // Check for paragraphs in output
    if (moduleResult.output.paragraphs && Array.isArray(moduleResult.output.paragraphs)) {
      const reconstructed = moduleResult.output.paragraphs
        .map((p: any) => p.content || '')
        .filter((content: string) => content.trim().length > 0)
        .join('\n\n');
      
      if (reconstructed.length > 0) {
        console.log('✅ Reconstructed from output paragraphs:', {
          paragraphCount: moduleResult.output.paragraphs.length,
          reconstructedLength: reconstructed.length,
          preview: reconstructed.substring(0, 100) + '...'
        });
        return reconstructed;
      }
    }
  }
  
  // Fallback: deep search for any content
  console.log('🔍 DEEP SEARCH FOR CONTENT');
  const fallbackContent = findContentInObject(moduleResult);
  
  if (fallbackContent) {
    console.log('✅ Found fallback content:', {
      length: fallbackContent.length,
      preview: fallbackContent.substring(0, 100) + '...',
      doubleNewlineCount: (fallbackContent.match(/\n\n/g) || []).length
    });
    return fallbackContent;
  }
  
  console.error('❌ NO CONTENT FOUND - This will cause position mapping issues');
  return '';
};

/**
 * Deep search for content in nested objects
 */
function findContentInObject(obj: any, path: string = ''): string | null {
  if (!obj || typeof obj !== 'object') return null;
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    // Check if this value is a string with substantial content
    if (typeof value === 'string' && value.trim().length > 20) {
      const isValidContent = /[a-zA-Z]{3,}/.test(value); // Has actual words
      if (isValidContent) {
        console.log(`Found potential content at ${currentPath}:`, {
          length: value.length,
          preview: value.substring(0, 50) + '...'
        });
        return value.trim();
      }
    }
    
    // Recursively search nested objects
    if (typeof value === 'object' && value !== null) {
      const nestedContent = findContentInObject(value, currentPath);
      if (nestedContent) return nestedContent;
    }
  }
  
  return null;
}
