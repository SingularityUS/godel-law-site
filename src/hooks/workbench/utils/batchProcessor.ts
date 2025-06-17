
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
 * Process paragraphs in batches for individual analysis
 */
export const processParagraphBatches = async (
  paragraphs: any[],
  processingFunction: (paragraph: any, index: number) => Promise<any>,
  options: Partial<BatchProcessingOptions> = {},
  onProgress?: (completed: number, total: number, outputGenerated?: number) => void
): Promise<any[]> => {
  const config = { ...DEFAULT_BATCH_OPTIONS, ...options };
  const results: any[] = [];
  let completedCount = 0;
  let totalOutputGenerated = 0;
  
  console.log(`Starting paragraph batch processing of ${paragraphs.length} paragraphs`);
  
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
    
    // Update progress
    if (onProgress) {
      onProgress(completedCount, paragraphs.length, totalOutputGenerated);
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

/**
 * Determine if content should be processed in batches
 */
export const shouldUseBatchProcessing = (data: any): boolean => {
  // Check for chunked documents OR large paragraph arrays
  return (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 1) ||
         (data.paragraphs && Array.isArray(data.paragraphs) && data.paragraphs.length > 1);
};

/**
 * Determine if we should process paragraphs individually
 */
export const shouldProcessParagraphsIndividually = (data: any, moduleType: string): boolean => {
  // Grammar checker should process paragraphs individually for better analysis
  return moduleType === 'grammar-checker' && 
         data.output && 
         Array.isArray(data.output.paragraphs) && 
         data.output.paragraphs.length > 1;
};

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
    const processIndividualParagraph = async (paragraph: any, index: number) => {
      console.log(`Processing paragraph ${index + 1}: "${paragraph.content?.substring(0, 50)}..."`);
      
      // Create a focused data structure for individual paragraph
      const paragraphData = {
        paragraph: paragraph,
        context: {
          totalParagraphs: data.output.paragraphs.length,
          currentIndex: index,
          documentType: data.output.documentType || 'legal'
        }
      };
      
      return await processingFunction(JSON.stringify(paragraphData, null, 2));
    };
    
    // Process paragraphs in batches
    const results = await processParagraphBatches(
      data.output.paragraphs,
      processIndividualParagraph,
      { maxConcurrent: 1, delayBetweenBatches: 500 }, // More conservative for individual paragraphs
      onProgress
    );
    
    // Combine all analysis results
    const allAnalysis: any[] = [];
    let totalErrors = 0;
    
    results.forEach((result, index) => {
      if (result.output && result.output.analysis) {
        if (Array.isArray(result.output.analysis)) {
          allAnalysis.push(...result.output.analysis);
        } else {
          allAnalysis.push(result.output.analysis);
        }
        
        if (result.output.overallAssessment?.totalErrors) {
          totalErrors += result.output.overallAssessment.totalErrors;
        }
      }
    });
    
    return {
      moduleType: moduleType,
      output: {
        analysis: allAnalysis,
        processingStats: {
          paragraphsAnalyzed: data.output.paragraphs.length,
          totalResults: allAnalysis.length,
          processedIndividually: true
        },
        overallAssessment: {
          totalErrors: totalErrors,
          totalParagraphs: data.output.paragraphs.length,
          averageScore: allAnalysis.length > 0 ? 
            allAnalysis.reduce((sum, item) => sum + (item.legalWritingScore || 0), 0) / allAnalysis.length : 0
        }
      },
      metadata: {
        processingTime: Date.now(),
        processedIndividually: true,
        totalParagraphs: data.output.paragraphs.length,
        timestamp: new Date().toISOString()
      }
    };
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
