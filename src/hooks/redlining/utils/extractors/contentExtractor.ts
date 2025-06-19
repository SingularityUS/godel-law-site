
/**
 * Content Extractor
 * 
 * Purpose: Extracts original document content from module results
 */

/**
 * Extract original content from module result
 */
export const extractOriginalContent = (moduleResult: any): string => {
  console.log('=== EXTRACTING ORIGINAL CONTENT ===');
  
  // Try multiple paths for original content
  const contentPaths = [
    moduleResult.metadata?.originalContent,
    moduleResult.originalContent,
    moduleResult.input?.originalContent,
    moduleResult.input?.content,
    moduleResult.content,
    moduleResult.finalOutput?.metadata?.originalContent
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.length > 0) {
      console.log(`Found original content (${path.length} characters)`);
      return path;
    }
  }
  
  console.warn('No original content found in module result');
  return '';
};
