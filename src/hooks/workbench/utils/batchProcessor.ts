
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
 * Process chunks in batches with enhanced progress tracking
 */
export const processBatches = async (
  chunks: DocumentChunk[],
  processingFunction: (chunkContent: string, chunkInfo: DocumentChunk) => Promise<any>,
  options: Partial<BatchProcessingOptions> = {},
  onProgress?: (completed: number, total: number, outputGenerated?: number) => void
): Promise<any[]> => {
  const config = { ...DEFAULT_BATCH_OPTIONS, ...options };
  const results: any[] = [];
  let completedCount = 0;
  let totalOutputGenerated = 0;
  
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
          
          // Count output items generated (paragraphs, errors, etc.)
          let outputCount = 0;
          if (result.output) {
            if (Array.isArray(result.output.paragraphs)) {
              outputCount = result.output.paragraphs.length;
            } else if (Array.isArray(result.output.analysis)) {
              outputCount = result.output.analysis.length;
            } else if (result.output.totalParagraphs) {
              outputCount = result.output.totalParagraphs;
            }
          }
          
          totalOutputGenerated += outputCount;
          
          // Add chunk metadata to result
          return {
            ...result,
            chunkInfo: {
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks,
              startPosition: chunk.startPosition,
              endPosition: chunk.endPosition,
              outputGenerated: outputCount
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
                endPosition: chunk.endPosition,
                outputGenerated: 0
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
    
    // Update progress with enhanced information
    if (onProgress) {
      onProgress(completedCount, chunks.length, totalOutputGenerated);
    }
    
    // Delay between batches (except for the last one)
    if (i + config.maxConcurrent < chunks.length) {
      console.log(`Waiting ${config.delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
    }
  }
  
  console.log(`Batch processing completed: ${results.length} results, ${totalOutputGenerated} items generated`);
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
  onProgress?: (completed: number, total: number, outputGenerated?: number) => void
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
