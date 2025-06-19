
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
  console.log('🔍 EXTRACTING FROM ANALYSIS - Enhanced for Grammar Results');
  
  const analysisPaths = [
    { path: moduleResult?.output?.analysis, name: 'output.analysis' },
    { path: moduleResult?.finalOutput?.output?.analysis, name: 'finalOutput.output.analysis' },
    { path: moduleResult?.analysis, name: 'analysis' }
  ];
  
  for (const { path, name } of analysisPaths) {
    if (Array.isArray(path) && path.length > 0) {
      console.log(`📄 Found analysis array at ${name} with ${path.length} items`);
      
      // Log structure of first few items to understand the data
      path.slice(0, 3).forEach((item, index) => {
        console.log(`Analysis item ${index} structure:`, {
          hasOriginalContent: !!item?.originalContent,
          originalContentLength: item?.originalContent?.length || 0,
          hasContent: !!item?.content,
          hasText: !!item?.text,
          hasParagraphContent: !!item?.paragraph?.content,
          hasOriginalIndex: !!item?.originalIndex,
          paragraphId: item?.paragraphId,
          keys: Object.keys(item || {})
        });
      });
      
      // Extract paragraphs with their content, prioritizing originalContent
      const paragraphData = path
        .map((item: any, index: number) => {
          // Priority order for content extraction
          const content = item?.originalContent ||      // ✅ Your data has this!
                         item?.content || 
                         item?.text || 
                         item?.paragraph?.content || 
                         item?.originalText;
          
          if (typeof content === 'string' && content.length > 0) {
            return {
              content,
              originalIndex: item?.originalIndex ?? index,
              paragraphId: item?.paragraphId || `para-${index}`,
              length: content.length
            };
          }
          return null;
        })
        .filter(item => item !== null);
      
      console.log(`📄 Extracted ${paragraphData.length} valid paragraphs from analysis`);
      
      if (paragraphData.length > 0) {
        // Sort by originalIndex to maintain document order
        paragraphData.sort((a, b) => (a.originalIndex || 0) - (b.originalIndex || 0));
        
        console.log('📄 Paragraph reconstruction order:', 
          paragraphData.map(p => `${p.paragraphId}(${p.length} chars, index: ${p.originalIndex})`));
        
        // Reconstruct the full document
        const reconstructed = paragraphData.map(p => p.content).join('\n\n');
        
        console.log(`✅ Successfully reconstructed document: ${reconstructed.length} chars from ${paragraphData.length} paragraphs`);
        console.log('📄 Reconstructed content preview:', reconstructed.substring(0, 300));
        console.log('📄 Reconstructed content end:', reconstructed.slice(-100));
        
        // Validate the reconstructed content
        if (reconstructed.length > 100) { // Ensure substantial content
          return reconstructed;
        } else {
          console.warn('⚠️ Reconstructed content too short, may be incomplete');
        }
      }
    }
  }
  
  console.log('❌ No valid content found in analysis structures');
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
