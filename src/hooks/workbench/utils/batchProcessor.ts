
/**
 * Batch Processor Utility
 * 
 * Purpose: Handles processing of chunked documents through the pipeline
 */

import { DocumentChunk, reassembleChunks } from "./documentChunker";

export interface BatchProcessingOptions {
  maxConcurrent: number;
  delayBetweenBatches: number;
  retryAttempts: number;
}

const DEFAULT_BATCH_OPTIONS: BatchProcessingOptions = {
  maxConcurrent: 2, // Process 2 chunks at a time to avoid rate limits
  delayBetweenBatches: 1000, // 1 second delay between batches
  retryAttempts: 2
};

/**
 * Process chunks in batches with progress tracking
 */
export const processBatches = async (
  chunks: DocumentChunk[],
  processingFunction: (chunkContent: string, chunkInfo: DocumentChunk) => Promise<any>,
  options: Partial<BatchProcessingOptions> = {},
  onProgress?: (completed: number, total: number) => void
): Promise<any[]> => {
  const config = { ...DEFAULT_BATCH_OPTIONS, ...options };
  const results: any[] = [];
  let completedCount = 0;
  
  console.log(`Starting batch processing of ${chunks.length} chunks`);
  
  // Process chunks in batches
  for (let i = 0; i < chunks.length; i += config.maxConcurrent) {
    const batch = chunks.slice(i, i + config.maxConcurrent);
    const batchNumber = Math.floor(i / config.maxConcurrent) + 1;
    const totalBatches = Math.ceil(chunks.length / config.maxConcurrent);
    
    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`);
    
    // Process batch concurrently
    const batchPromises = batch.map(async (chunk, batchIndex) => {
      const globalIndex = i + batchIndex;
      
      for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
        try {
          console.log(`Processing chunk ${globalIndex + 1}/${chunks.length} (attempt ${attempt})`);
          const result = await processingFunction(chunk.content, chunk);
          
          // Add chunk metadata to result
          return {
            ...result,
            chunkInfo: {
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks,
              startPosition: chunk.startPosition,
              endPosition: chunk.endPosition
            }
          };
        } catch (error) {
          console.error(`Error processing chunk ${globalIndex + 1}, attempt ${attempt}:`, error);
          
          if (attempt === config.retryAttempts) {
            // Final attempt failed, return error result
            return {
              error: `Failed to process chunk ${globalIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              chunkInfo: {
                chunkIndex: chunk.chunkIndex,
                totalChunks: chunk.totalChunks,
                startPosition: chunk.startPosition,
                endPosition: chunk.endPosition
              }
            };
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    completedCount += batch.length;
    
    // Update progress
    if (onProgress) {
      onProgress(completedCount, chunks.length);
    }
    
    // Delay between batches (except for the last one)
    if (i + config.maxConcurrent < chunks.length) {
      console.log(`Waiting ${config.delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
    }
  }
  
  console.log(`Batch processing completed: ${results.length} results`);
  return results;
};

/**
 * Determine if content should be processed in batches
 */
export const shouldUseBatchProcessing = (data: any): boolean => {
  // Check for chunked documents OR large paragraph arrays
  return (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 1) ||
         (data.paragraphs && Array.isArray(data.paragraphs) && data.paragraphs.length > 50);
};

/**
 * Process data either as single chunk or in batches - enhanced for paragraph processing
 */
export const processWithBatching = async (
  data: any,
  processingFunction: (content: string, chunkInfo?: DocumentChunk) => Promise<any>,
  onProgress?: (completed: number, total: number) => void
): Promise<any> => {
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
    console.log(`Processing all ${data.paragraphs.length} paragraphs in batches for comprehensive analysis`);
    
    // For paragraph processing, we need to send all paragraphs to ensure complete processing
    const fullDataString = JSON.stringify(data, null, 2);
    console.log(`Sending ${data.paragraphs.length} paragraphs for processing`);
    
    if (onProgress) {
      onProgress(0, 1); // Start progress
    }
    
    const result = await processingFunction(fullDataString);
    
    if (onProgress) {
      onProgress(1, 1); // Complete progress
    }
    
    // Ensure we return the processing statistics
    if (result.output && result.output.processingStats) {
      console.log(`Processed ${result.output.processingStats.paragraphsAnalyzed || data.paragraphs.length} paragraphs`);
    }
    
    return result;
  } else {
    console.log('Processing as single document');
    return await processingFunction(data.content || JSON.stringify(data));
  }
};
