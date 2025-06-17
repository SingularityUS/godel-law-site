
/**
 * Batch Strategy Utilities
 * 
 * Purpose: Determine batch processing strategies and validation
 */

/**
 * Determine if content should be processed in batches
 */
export const shouldUseBatchProcessing = (data: any): boolean => {
  if (!data) return false;
  
  // Check for chunked documents OR large paragraph arrays
  const hasChunks = data.chunks && Array.isArray(data.chunks) && data.chunks.length > 1;
  const hasMultipleParagraphs = data.paragraphs && Array.isArray(data.paragraphs) && data.paragraphs.length > 1;
  const hasOutputParagraphs = data.output && Array.isArray(data.output.paragraphs) && data.output.paragraphs.length > 1;
  
  const shouldBatch = hasChunks || hasMultipleParagraphs || hasOutputParagraphs;
  console.log(`Batch processing check:`, {
    hasChunks,
    hasMultipleParagraphs,
    hasOutputParagraphs,
    shouldBatch
  });
  
  return shouldBatch;
};

/**
 * Determine if we should process paragraphs individually with enhanced validation
 */
export const shouldProcessParagraphsIndividually = (data: any, moduleType: string): boolean => {
  if (!data || moduleType !== 'grammar-checker') return false;
  
  // Enhanced validation for grammar checker individual processing
  const hasOutputParagraphs = data.output && 
                             Array.isArray(data.output.paragraphs) && 
                             data.output.paragraphs.length > 1;
  
  const hasParagraphs = Array.isArray(data.paragraphs) && data.paragraphs.length > 1;
  
  const shouldProcessIndividually = hasOutputParagraphs || hasParagraphs;
  
  console.log(`Individual paragraph processing check for ${moduleType}:`, {
    hasOutputParagraphs: hasOutputParagraphs ? data.output.paragraphs.length : 0,
    hasParagraphs: hasParagraphs ? data.paragraphs.length : 0,
    shouldProcessIndividually
  });
  
  return shouldProcessIndividually;
};
