
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
  console.log('Module result structure:', {
    hasMetadata: !!moduleResult.metadata,
    hasOriginalContent: !!moduleResult.originalContent,
    hasInput: !!moduleResult.input,
    hasContent: !!moduleResult.content,
    resultKeys: Object.keys(moduleResult)
  });
  
  // Try multiple paths for original content
  const contentPaths = [
    moduleResult.metadata?.originalContent,
    moduleResult.originalContent,
    moduleResult.input?.originalContent,
    moduleResult.input?.content,
    moduleResult.content,
    moduleResult.finalOutput?.metadata?.originalContent,
    // Additional paths for different module structures
    moduleResult.processableContent,
    moduleResult.metadata?.processableContent
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.length > 0) {
      console.log(`Found original content (${path.length} characters) from path`);
      return path;
    }
  }
  
  console.warn('No original content found in module result');
  return '';
};
