
/**
 * Paragraph Batch Processor
 * 
 * Purpose: Handles processing of paragraphs in batches for individual analysis with streaming results
 */

import { BatchProcessingOptions, PARAGRAPH_BATCH_OPTIONS } from "./batchConfig";

/**
 * Process paragraphs in batches for individual analysis with streaming support
 */
export const processParagraphBatches = async (
  paragraphs: any[],
  processingFunction: (paragraph: any, index: number) => Promise<any>,
  options: Partial<BatchProcessingOptions> = {},
  onProgress?: (completed: number, total: number, outputGenerated?: number) => void
): Promise<any[]> => {
  const config = { ...PARAGRAPH_BATCH_OPTIONS, ...options };
  const results: any[] = [];
  let completedCount = 0;
  let totalOutputGenerated = 0;
  
  console.log(`Starting paragraph batch processing of ${paragraphs.length} paragraphs`);
  
  // Report initial progress correctly
  if (onProgress) {
    onProgress(0, paragraphs.length, 0);
  }
  
  // Process paragraphs in batches
  for (let i = 0; i < paragraphs.length; i += config.maxConcurrent) {
    const batch = paragraphs.slice(i, i + config.maxConcurrent);
    const batchNumber = Math.floor(i / config.maxConcurrent) + 1;
    const totalBatches = Math.ceil(paragraphs.length / config.maxConcurrent);
    
    console.log(`Processing paragraph batch ${batchNumber}/${totalBatches} (${batch.length} paragraphs)`);
    
    // Process batch concurrently
    const batchPromises = batch.map(async (paragraph, batchIndex) => {
      const globalIndex = i + batchIndex;
      
      for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
        try {
          console.log(`Processing paragraph ${globalIndex + 1}/${paragraphs.length} (attempt ${attempt})`);
          const result = await processingFunction(paragraph, globalIndex);
          
          // Count output items generated
          let outputCount = 0;
          if (result.output) {
            if (Array.isArray(result.output.analysis)) {
              outputCount = result.output.analysis.length;
            } else if (result.output.analysis) {
              outputCount = 1;
            }
          }
          
          totalOutputGenerated += outputCount;
          
          return {
            ...result,
            paragraphIndex: globalIndex,
            outputGenerated: outputCount
          };
        } catch (error) {
          console.error(`Error processing paragraph ${globalIndex + 1}, attempt ${attempt}:`, error);
          
          if (attempt === config.retryAttempts) {
            return {
              error: `Failed to process paragraph ${globalIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              paragraphIndex: globalIndex,
              outputGenerated: 0
            };
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    completedCount += batch.length;
    
    // Update progress with correct counts
    console.log(`Progress update: ${completedCount}/${paragraphs.length} paragraphs completed`);
    if (onProgress) {
      onProgress(completedCount, paragraphs.length, totalOutputGenerated);
    }
    
    // STREAMING: Emit incremental results for immediate redline processing
    if (window.streamingRedlineCallback && batchResults.length > 0) {
      // Combine batch results for streaming
      const combinedBatchResult = {
        output: {
          analysis: batchResults.flatMap(result => result.output?.analysis || [])
        },
        metadata: {
          batchNumber,
          totalBatches,
          paragraphsInBatch: batch.length,
          completedParagraphs: completedCount
        }
      };
      
      try {
        window.streamingRedlineCallback(combinedBatchResult, batchNumber - 1, totalBatches);
        console.log(`Streaming callback triggered for paragraph batch ${batchNumber}/${totalBatches}`);
      } catch (error) {
        console.error('Error in streaming paragraph callback:', error);
      }
    }
    
    // Delay between batches
    if (i + config.maxConcurrent < paragraphs.length) {
      console.log(`Waiting ${config.delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
    }
  }
  
  console.log(`Paragraph batch processing completed: ${results.length} results, ${totalOutputGenerated} items generated`);
  return results;
};
