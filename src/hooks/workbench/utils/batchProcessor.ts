
/**
 * Batch Processor Utility
 * 
 * Purpose: Main orchestrator for batch processing of documents and paragraphs
 */

import { DocumentChunk, reassembleChunks } from "./documentChunker";
import { processBatches } from "./chunkBatchProcessor";
import { processParagraphBatches } from "./paragraphBatchProcessor";
import { 
  shouldUseBatchProcessing, 
  shouldProcessParagraphsIndividually,
  processIndividualParagraph,
  combineAnalysisResults
} from "./batchUtils";

// Re-export types and configurations for backward compatibility
export type { BatchProcessingOptions } from "./batchConfig";
export { DEFAULT_BATCH_OPTIONS, PARAGRAPH_BATCH_OPTIONS } from "./batchConfig";

// Re-export utility functions
export { shouldUseBatchProcessing, shouldProcessParagraphsIndividually } from "./batchUtils";

// Re-export processors
export { processBatches } from "./chunkBatchProcessor";
export { processParagraphBatches } from "./paragraphBatchProcessor";

/**
 * Process data either as single chunk or in batches - enhanced for paragraph processing
 */
export const processWithBatching = async (
  data: any,
  processingFunction: (content: string, chunkInfo?: DocumentChunk) => Promise<any>,
  onProgress?: (completed: number, total: number, outputGenerated?: number) => void,
  moduleType?: string
): Promise<any> => {
  // Check if we should process paragraphs individually (for grammar checker)
  if (shouldProcessParagraphsIndividually(data, moduleType || '')) {
    console.log(`Processing ${data.output.paragraphs.length} paragraphs individually for ${moduleType}`);
    
    // Create a processing function for individual paragraphs
    const processIndividualParagraphWrapper = async (paragraph: any, index: number) => {
      return await processIndividualParagraph(
        paragraph, 
        index, 
        data.output.paragraphs.length, 
        data.output.documentType || 'legal',
        processingFunction
      );
    };
    
    // Process paragraphs in batches
    const results = await processParagraphBatches(
      data.output.paragraphs,
      processIndividualParagraphWrapper,
      {},
      onProgress
    );
    
    // Combine all analysis results
    return combineAnalysisResults(results, data.output.paragraphs.length, moduleType);
  }
  
  if (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 1) {
    console.log('Using batch processing for chunked document');
    const results = await processBatches(
      data.chunks,
      processingFunction,
      {},
      onProgress
    );
    return reassembleChunks(results);
  } else if (data.paragraphs && Array.isArray(data.paragraphs)) {
    console.log(`Processing all ${data.paragraphs.length} paragraphs for comprehensive analysis`);
    
    // For paragraph processing, we track progress by paragraphs
    const totalParagraphs = data.paragraphs.length;
    
    if (onProgress) {
      onProgress(0, totalParagraphs, 0); // Start progress
    }
    
    const fullDataString = JSON.stringify(data, null, 2);
    console.log(`Sending ${totalParagraphs} paragraphs for processing`);
    
    const result = await processingFunction(fullDataString);
    
    // Count output generated
    let outputGenerated = 0;
    if (result.output) {
      if (Array.isArray(result.output.analysis)) {
        outputGenerated = result.output.analysis.length;
      } else if (result.output.processingStats?.paragraphsAnalyzed) {
        outputGenerated = result.output.processingStats.paragraphsAnalyzed;
      }
    }
    
    if (onProgress) {
      onProgress(totalParagraphs, totalParagraphs, outputGenerated); // Complete progress
    }
    
    // Ensure we return the processing statistics
    if (result.output && result.output.processingStats) {
      console.log(`Processed ${result.output.processingStats.paragraphsAnalyzed || totalParagraphs} paragraphs`);
    }
    
    return result;
  } else {
    console.log('Processing as single document');
    
    if (onProgress) {
      onProgress(0, 1, 0);
    }
    
    const result = await processingFunction(data.content || JSON.stringify(data));
    
    if (onProgress) {
      onProgress(1, 1, 1);
    }
    
    return result;
  }
};
