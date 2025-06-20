
/**
 * Content Extractor
 * 
 * Purpose: Enhanced content extraction that correctly sources original document content
 */

export const extractOriginalContent = (moduleResult: any, pipelineResults?: any[]): string => {
  console.log('=== EXTRACTING ORIGINAL CONTENT (CORRECTED SOURCING) ===');
  console.log('Module result structure:', {
    hasMetadata: !!moduleResult.metadata,
    hasOriginalContent: !!moduleResult.originalContent,
    hasInput: !!moduleResult.input,
    hasContent: !!moduleResult.content,
    hasOutput: !!moduleResult.output,
    resultKeys: Object.keys(moduleResult || {})
  });
  
  // For citation-finder and other analysis modules, we need to get content from source modules
  // Check if we have pipeline results to trace back to the source
  if (pipelineResults && Array.isArray(pipelineResults)) {
    console.log('🔍 TRACING BACK TO SOURCE MODULES:', {
      totalResults: pipelineResults.length,
      moduleTypes: pipelineResults.map(r => r.moduleType)
    });
    
    // Look for source modules that contain the original document content
    const sourceModules = ['document-input', 'paragraph-splitter'];
    
    for (const sourceType of sourceModules) {
      const sourceResult = pipelineResults.find(r => r.moduleType === sourceType);
      if (sourceResult && sourceResult.result) {
        console.log(`📄 CHECKING ${sourceType.toUpperCase()} FOR ORIGINAL CONTENT`);
        
        // Try to extract content from source module
        const sourceContent = extractContentFromSourceModule(sourceResult.result, sourceType);
        if (sourceContent && sourceContent.length > 0) {
          console.log(`✅ FOUND ORIGINAL CONTENT FROM ${sourceType.toUpperCase()}:`, {
            length: sourceContent.length,
            preview: sourceContent.substring(0, 100) + '...',
            doubleNewlineCount: (sourceContent.match(/\n\n/g) || []).length
          });
          return sourceContent;
        }
      }
    }
  }
  
  // Fallback to direct content checks if no pipeline results available
  if (moduleResult.originalContent && typeof moduleResult.originalContent === 'string') {
    const content = moduleResult.originalContent.trim();
    if (content.length > 0) {
      console.log('✅ Found direct originalContent:', {
        length: content.length,
        preview: content.substring(0, 100) + '...'
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
        preview: content.substring(0, 100) + '...'
      });
      return content;
    }
  }
  
  // Check input data structures
  if (moduleResult.input) {
    console.log('🔍 CHECKING INPUT STRUCTURES:', Object.keys(moduleResult.input));
    
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
          preview: reconstructed.substring(0, 100) + '...'
        });
        return reconstructed;
      }
    }
  }
  
  // Check output for content
  if (moduleResult.output) {
    const outputKeys = Object.keys(moduleResult.output);
    console.log('Output keys:', outputKeys);
    
    const contentKeys = ['content', 'originalContent', 'text', 'originalText'];
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
  
  console.error('❌ NO CONTENT FOUND - This will cause position mapping issues');
  return '';
};

/**
 * Extract content from source modules (document-input, paragraph-splitter)
 */
function extractContentFromSourceModule(sourceResult: any, moduleType: string): string | null {
  console.log(`🔍 EXTRACTING FROM ${moduleType.toUpperCase()}:`, {
    hasOutput: !!sourceResult.output,
    hasContent: !!sourceResult.content,
    hasOriginalContent: !!sourceResult.originalContent,
    outputKeys: sourceResult.output ? Object.keys(sourceResult.output) : []
  });
  
  if (moduleType === 'document-input') {
    // Document input should have the original content
    if (sourceResult.content && typeof sourceResult.content === 'string') {
      return sourceResult.content.trim();
    }
    if (sourceResult.originalContent && typeof sourceResult.originalContent === 'string') {
      return sourceResult.originalContent.trim();
    }
    if (sourceResult.output?.content && typeof sourceResult.output.content === 'string') {
      return sourceResult.output.content.trim();
    }
  }
  
  if (moduleType === 'paragraph-splitter') {
    // Paragraph splitter should have paragraphs we can reconstruct
    if (sourceResult.output?.paragraphs && Array.isArray(sourceResult.output.paragraphs)) {
      const reconstructed = sourceResult.output.paragraphs
        .map((p: any) => p.content || '')
        .filter((content: string) => content.trim().length > 0)
        .join('\n\n');
      
      if (reconstructed.length > 0) {
        console.log(`📝 RECONSTRUCTED FROM ${moduleType.toUpperCase()} PARAGRAPHS:`, {
          paragraphCount: sourceResult.output.paragraphs.length,
          totalLength: reconstructed.length,
          doubleNewlineCount: (reconstructed.match(/\n\n/g) || []).length
        });
        return reconstructed;
      }
    }
    
    // Fallback to input content if available
    if (sourceResult.input?.content && typeof sourceResult.input.content === 'string') {
      return sourceResult.input.content.trim();
    }
  }
  
  console.warn(`❌ Could not extract content from ${moduleType}`);
  return null;
}

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
