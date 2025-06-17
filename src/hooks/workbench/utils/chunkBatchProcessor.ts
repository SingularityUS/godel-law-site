
/**
 * Chunk Batch Processor
 * 
 * Purpose: Handles processing of document chunks in batches
 */

import { DocumentChunk, reassembleChunks } from "./documentChunker";
import { BatchProcessingOptions, DEFAULT_BATCH_OPTIONS } from "./batchConfig";

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
