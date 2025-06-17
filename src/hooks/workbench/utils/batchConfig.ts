
/**
 * Batch Configuration
 * 
 * Purpose: Configuration types and defaults for batch processing
 */

export interface BatchProcessingOptions {
  maxConcurrent: number;
  delayBetweenBatches: number;
  retryAttempts: number;
}

export const DEFAULT_BATCH_OPTIONS: BatchProcessingOptions = {
  maxConcurrent: 2, // Process 2 chunks at a time to avoid rate limits
  delayBetweenBatches: 1000, // 1 second delay between batches
  retryAttempts: 2
};

export const PARAGRAPH_BATCH_OPTIONS: BatchProcessingOptions = {
  maxConcurrent: 1, // More conservative for individual paragraphs
  delayBetweenBatches: 500,
  retryAttempts: 2
};
