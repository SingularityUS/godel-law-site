/**
 * Content Extractor
 * 
 * Purpose: Extracts original document content from module results with enhanced detection and debugging
 */

/**
 * Extract original content from module result with multiple fallback strategies and detailed logging
 */
export const extractOriginalContent = (moduleResult: any): string => {
  console.log('=== EXTRACTING ORIGINAL CONTENT (Enhanced Debug) ===');
  console.log('Module result structure:', {
    hasMetadata: !!moduleResult.metadata,
    hasOriginalContent: !!moduleResult.originalContent,
    hasInput: !!moduleResult.input,
    hasContent: !!moduleResult.content,
    hasOutput: !!moduleResult.output,
    resultKeys: Object.keys(moduleResult || {})
  });
  
  // Log the actual content lengths to identify truncation
  const logContentSource = (source: string, content: any) => {
    if (typeof content === 'string') {
      console.log(`${source}: ${content.length} chars`);
      console.log(`${source} preview:`, content.substring(0, 200));
      return content;
    }
    return null;
  };
  
  // Strategy 1: Look for direct original content paths with detailed logging
  const directContentPaths = [
    { path: moduleResult?.metadata?.originalContent, name: 'metadata.originalContent' },
    { path: moduleResult?.originalContent, name: 'originalContent' },
    { path: moduleResult?.input?.originalContent, name: 'input.originalContent' },
    { path: moduleResult?.input?.content, name: 'input.content' },
    { path: moduleResult?.input?.processableContent, name: 'input.processableContent' },
  ];
  
  for (const { path, name } of directContentPaths) {
    const content = logContentSource(name, path);
    if (content && isValidContent(content)) {
      console.log(`✅ Using original content from ${name} (${content.length} characters)`);
      return content;
    }
  }
  
  // Strategy 2: Look for content in nested structures with detailed logging
  const nestedContentPaths = [
    { path: moduleResult?.output?.metadata?.originalContent, name: 'output.metadata.originalContent' },
    { path: moduleResult?.finalOutput?.metadata?.originalContent, name: 'finalOutput.metadata.originalContent' },
    { path: moduleResult?.result?.metadata?.originalContent, name: 'result.metadata.originalContent' },
    { path: moduleResult?.metadata?.processableContent, name: 'metadata.processableContent' },
    { path: moduleResult?.processableContent, name: 'processableContent' }
  ];
  
  for (const { path, name } of nestedContentPaths) {
    const content = logContentSource(name, path);
    if (content && isValidContent(content)) {
      console.log(`✅ Using original content from ${name} (${content.length} characters)`);
      return content;
    }
  }
  
  // Strategy 3: Extract from analysis data if it contains readable content
  const analysisContent = extractContentFromAnalysis(moduleResult);
  if (analysisContent) {
    console.log(`✅ Extracted content from analysis data (${analysisContent.length} characters)`);
    console.log('Analysis content preview:', analysisContent.substring(0, 200));
    return analysisContent;
  }
  
  // Strategy 4: Look for any content field that seems like document text
  const fallbackContent = findFallbackContent(moduleResult);
  if (fallbackContent) {
    console.log(`✅ Found fallback content (${fallbackContent.length} characters)`);
    console.log('Fallback content preview:', fallbackContent.substring(0, 200));
    return fallbackContent;
  }
  
  console.error('❌ No original content found in module result');
  console.log('Available keys in module result:', Object.keys(moduleResult || {}));
  
  // Log the entire structure for debugging (limited to avoid console spam)
  console.log('Full module result structure (first level):', 
    Object.keys(moduleResult || {}).reduce((acc, key) => {
      const value = moduleResult[key];
      acc[key] = {
        type: typeof value,
        isArray: Array.isArray(value),
        keys: typeof value === 'object' && value !== null ? Object.keys(value) : undefined,
        length: typeof value === 'string' ? value.length : undefined
      };
      return acc;
    }, {} as any)
  );
  
  return '';
};

/**
 * Check if content is valid (string with reasonable length) with better validation
 */
function isValidContent(content: any): content is string {
  const isValid = typeof content === 'string' && 
         content.length > 10 && 
         !content.startsWith('{') && // Not JSON
         !content.startsWith('[');   // Not array
         
  if (typeof content === 'string') {
    console.log(`Content validation: ${content.length} chars, starts with: "${content.substring(0, 50)}...", isValid: ${isValid}`);
  }
  
  return isValid;
}

function extractContentFromAnalysis(moduleResult: any): string | null {
  console.log('Attempting to extract content from analysis structures...');
  
  const analysisPaths = [
    { path: moduleResult?.output?.analysis, name: 'output.analysis' },
    { path: moduleResult?.finalOutput?.output?.analysis, name: 'finalOutput.output.analysis' },
    { path: moduleResult?.analysis, name: 'analysis' }
  ];
  
  for (const { path, name } of analysisPaths) {
    if (Array.isArray(path) && path.length > 0) {
      console.log(`Found analysis array at ${name} with ${path.length} items`);
      
      // Try to reconstruct content from paragraph analysis
      const paragraphTexts = path
        .map((item: any, index: number) => {
          const text = item?.content || 
                 item?.text || 
                 item?.paragraph?.content || 
                 item?.originalText;
          
          if (typeof text === 'string' && text.length > 0) {
            console.log(`Analysis item ${index}: ${text.length} chars`);
            return text;
          }
          return null;
        })
        .filter(text => text !== null);
      
      if (paragraphTexts.length > 0) {
        const reconstructed = paragraphTexts.join('\n\n');
        console.log(`Reconstructed ${reconstructed.length} chars from ${paragraphTexts.length} analysis items`);
        return reconstructed;
      }
    }
  }
  
  return null;
}

function findFallbackContent(obj: any, visited = new Set()): string | null {
  if (!obj || typeof obj !== 'object' || visited.has(obj)) {
    return null;
  }
  
  visited.add(obj);
  
  // Look for keys that commonly contain document content
  const contentKeys = ['content', 'text', 'document', 'originalText', 'documentText', 'fullText', 'rawText'];
  
  for (const key of contentKeys) {
    const value = obj[key];
    if (isValidContent(value)) {
      console.log(`Found fallback content in key: ${key}`);
      return value;
    }
  }
  
  // Recursively search nested objects (limit depth to prevent infinite loops)
  if (visited.size < 20) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object') {
        const result = findFallbackContent(value, visited);
        if (result) {
          console.log(`Found fallback content in nested key: ${key}`);
          return result;
        }
      }
    }
  }
  
  return null;
}
