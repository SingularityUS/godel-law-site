
/**
 * Content Extractor
 * 
 * Purpose: Extracts original document content from module results with enhanced detection
 */

/**
 * Extract original content from module result with multiple fallback strategies
 */
export const extractOriginalContent = (moduleResult: any): string => {
  console.log('=== EXTRACTING ORIGINAL CONTENT (Enhanced) ===');
  console.log('Module result structure:', {
    hasMetadata: !!moduleResult.metadata,
    hasOriginalContent: !!moduleResult.originalContent,
    hasInput: !!moduleResult.input,
    hasContent: !!moduleResult.content,
    hasOutput: !!moduleResult.output,
    resultKeys: Object.keys(moduleResult || {})
  });
  
  // Strategy 1: Look for direct original content paths
  const directContentPaths = [
    moduleResult?.metadata?.originalContent,
    moduleResult?.originalContent,
    moduleResult?.input?.originalContent,
    moduleResult?.input?.content,
  ];
  
  for (const path of directContentPaths) {
    if (isValidContent(path)) {
      console.log(`Found original content via direct path (${path.length} characters)`);
      return path;
    }
  }
  
  // Strategy 2: Look for content in nested structures
  const nestedContentPaths = [
    moduleResult?.output?.metadata?.originalContent,
    moduleResult?.finalOutput?.metadata?.originalContent,
    moduleResult?.result?.metadata?.originalContent,
    moduleResult?.metadata?.processableContent,
    moduleResult?.processableContent
  ];
  
  for (const path of nestedContentPaths) {
    if (isValidContent(path)) {
      console.log(`Found original content via nested path (${path.length} characters)`);
      return path;
    }
  }
  
  // Strategy 3: Extract from analysis data if it contains readable content
  const analysisContent = extractContentFromAnalysis(moduleResult);
  if (analysisContent) {
    console.log(`Extracted content from analysis data (${analysisContent.length} characters)`);
    return analysisContent;
  }
  
  // Strategy 4: Look for any content field that seems like document text
  const fallbackContent = findFallbackContent(moduleResult);
  if (fallbackContent) {
    console.log(`Found fallback content (${fallbackContent.length} characters)`);
    return fallbackContent;
  }
  
  console.warn('No original content found in module result');
  return '';
};

/**
 * Check if content is valid (string with reasonable length)
 */
function isValidContent(content: any): content is string {
  return typeof content === 'string' && 
         content.length > 10 && 
         !content.startsWith('{') && // Not JSON
         !content.startsWith('[');   // Not array
}

/**
 * Extract content from analysis data structures
 */
function extractContentFromAnalysis(moduleResult: any): string | null {
  const analysisPaths = [
    moduleResult?.output?.analysis,
    moduleResult?.finalOutput?.output?.analysis,
    moduleResult?.analysis
  ];
  
  for (const analysis of analysisPaths) {
    if (Array.isArray(analysis) && analysis.length > 0) {
      // Try to reconstruct content from paragraph analysis
      const paragraphTexts = analysis
        .map((item: any) => {
          // Look for paragraph content in various formats
          return item?.content || 
                 item?.text || 
                 item?.paragraph?.content || 
                 item?.originalText;
        })
        .filter(text => typeof text === 'string' && text.length > 0);
      
      if (paragraphTexts.length > 0) {
        return paragraphTexts.join('\n\n');
      }
    }
  }
  
  return null;
}

/**
 * Find any content that looks like document text
 */
function findFallbackContent(obj: any, visited = new Set()): string | null {
  if (!obj || typeof obj !== 'object' || visited.has(obj)) {
    return null;
  }
  
  visited.add(obj);
  
  // Look for keys that commonly contain document content
  const contentKeys = ['content', 'text', 'document', 'originalText', 'documentText'];
  
  for (const key of contentKeys) {
    const value = obj[key];
    if (isValidContent(value)) {
      return value;
    }
  }
  
  // Recursively search nested objects
  for (const value of Object.values(obj)) {
    if (typeof value === 'object') {
      const result = findFallbackContent(value, visited);
      if (result) {
        return result;
      }
    }
  }
  
  return null;
}
