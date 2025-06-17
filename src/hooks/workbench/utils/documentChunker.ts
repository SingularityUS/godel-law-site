
/**
 * Document Chunker Utility
 * 
 * Purpose: Handles splitting large documents into manageable chunks for processing
 */

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  startPosition: number;
  endPosition: number;
  overlap?: string;
}

export interface ChunkingOptions {
  maxTokens: number;
  overlapSize: number;
  preserveParagraphs: boolean;
}

const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxTokens: 3000, // Conservative estimate for token limits
  overlapSize: 200, // Characters to overlap between chunks
  preserveParagraphs: true
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

/**
 * Split text at appropriate boundaries (paragraphs, sentences, words)
 */
const findSplitPoint = (text: string, maxLength: number, preserveParagraphs: boolean): number => {
  if (text.length <= maxLength) return text.length;
  
  let splitPoint = maxLength;
  
  if (preserveParagraphs) {
    // Try to split at paragraph breaks first
    const paragraphBreak = text.lastIndexOf('\n\n', maxLength);
    if (paragraphBreak > maxLength * 0.5) {
      return paragraphBreak + 2;
    }
    
    // Try to split at single line breaks
    const lineBreak = text.lastIndexOf('\n', maxLength);
    if (lineBreak > maxLength * 0.7) {
      return lineBreak + 1;
    }
  }
  
  // Try to split at sentence boundaries
  const sentenceEnd = text.lastIndexOf('.', maxLength);
  if (sentenceEnd > maxLength * 0.7) {
    return sentenceEnd + 1;
  }
  
  // Fall back to word boundaries
  const wordBoundary = text.lastIndexOf(' ', maxLength);
  if (wordBoundary > maxLength * 0.8) {
    return wordBoundary + 1;
  }
  
  // Last resort: hard split
  return maxLength;
};

/**
 * Split a document into chunks with overlap
 */
export const chunkDocument = (
  text: string, 
  fileName: string,
  options: Partial<ChunkingOptions> = {}
): DocumentChunk[] => {
  const config = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  const maxCharsPerChunk = config.maxTokens * 4; // Convert tokens to characters
  
  if (estimateTokens(text) <= config.maxTokens) {
    // Document is small enough to process as single chunk
    return [{
      id: `${fileName}-chunk-0`,
      content: text,
      chunkIndex: 0,
      totalChunks: 1,
      startPosition: 0,
      endPosition: text.length
    }];
  }
  
  const chunks: DocumentChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;
  
  while (currentPosition < text.length) {
    const remainingText = text.slice(currentPosition);
    const chunkSize = Math.min(maxCharsPerChunk, remainingText.length);
    
    let splitPoint = findSplitPoint(remainingText, chunkSize, config.preserveParagraphs);
    let chunkContent = remainingText.slice(0, splitPoint);
    
    // Add overlap from previous chunk
    let overlap = '';
    if (chunkIndex > 0 && config.overlapSize > 0) {
      const overlapStart = Math.max(0, currentPosition - config.overlapSize);
      overlap = text.slice(overlapStart, currentPosition);
      chunkContent = overlap + chunkContent;
    }
    
    chunks.push({
      id: `${fileName}-chunk-${chunkIndex}`,
      content: chunkContent,
      chunkIndex,
      totalChunks: 0, // Will be updated after all chunks are created
      startPosition: currentPosition,
      endPosition: currentPosition + splitPoint,
      overlap: overlap || undefined
    });
    
    currentPosition += splitPoint;
    chunkIndex++;
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
  });
  
  console.log(`Document "${fileName}" split into ${chunks.length} chunks`);
  return chunks;
};

/**
 * Reassemble processed chunks into a single result with enhanced handling for different module types
 */
export const reassembleChunks = (processedChunks: any[]): any => {
  if (processedChunks.length === 1) {
    console.log('Single chunk result, returning as-is');
    return processedChunks[0];
  }
  
  console.log(`Reassembling ${processedChunks.length} chunks`);
  
  // Get the module type from the first chunk
  const moduleType = processedChunks[0].moduleType;
  console.log(`Reassembling chunks for module type: ${moduleType}`);
  
  const combinedResult = {
    moduleType: moduleType,
    output: null as any,
    metadata: {
      totalChunks: processedChunks.length,
      combinedResults: true,
      processingTime: processedChunks.reduce((total, chunk) => 
        total + (chunk.metadata?.processingTime || 0), 0
      ),
      timestamp: new Date().toISOString()
    }
  };
  
  // Special handling for grammar checker - merge analysis arrays
  if (moduleType === 'grammar-checker') {
    console.log('Processing grammar checker chunks');
    
    const allAnalysis: any[] = [];
    let combinedOverallAssessment: any = {
      totalErrors: 0,
      writingQuality: 'Good',
      overallScore: 8
    };
    
    processedChunks.forEach((chunk, index) => {
      console.log(`Processing chunk ${index + 1}/${processedChunks.length} for grammar analysis`);
      
      if (chunk.output && chunk.output.analysis && Array.isArray(chunk.output.analysis)) {
        console.log(`Found ${chunk.output.analysis.length} paragraphs in chunk ${index + 1}`);
        
        // Add chunk prefix to paragraph IDs to ensure uniqueness
        const chunkAnalysis = chunk.output.analysis.map((para: any, paraIndex: number) => ({
          ...para,
          paragraphId: `chunk-${index + 1}-para-${paraIndex + 1}`,
          chunkInfo: {
            chunkIndex: index,
            totalChunks: processedChunks.length
          }
        }));
        
        allAnalysis.push(...chunkAnalysis);
        
        // Accumulate overall assessment
        if (chunk.output.overallAssessment) {
          combinedOverallAssessment.totalErrors += chunk.output.overallAssessment.totalErrors || 0;
        }
      } else {
        console.warn(`Chunk ${index + 1} missing grammar analysis data:`, chunk.output);
        
        // Create fallback analysis for this chunk
        allAnalysis.push({
          paragraphId: `chunk-${index + 1}-para-1`,
          original: typeof chunk.output === 'string' ? chunk.output.substring(0, 500) : 'Content processed',
          corrected: 'Analysis completed - see full response',
          suggestions: [],
          legalWritingScore: 7,
          improvementSummary: `Chunk ${index + 1} processed`,
          chunkInfo: {
            chunkIndex: index,
            totalChunks: processedChunks.length
          }
        });
      }
    });
    
    // Calculate average writing quality
    const avgScore = allAnalysis.length > 0 
      ? Math.round(allAnalysis.reduce((sum, para) => sum + (para.legalWritingScore || 7), 0) / allAnalysis.length)
      : 8;
    
    combinedOverallAssessment.overallScore = avgScore;
    combinedOverallAssessment.writingQuality = avgScore >= 8 ? 'Good' : avgScore >= 6 ? 'Fair' : 'Needs Improvement';
    
    combinedResult.output = {
      analysis: allAnalysis,
      overallAssessment: combinedOverallAssessment,
      chunkingInfo: {
        totalChunks: processedChunks.length,
        totalParagraphs: allAnalysis.length,
        reassembledAt: new Date().toISOString()
      }
    };
    
    console.log(`Grammar analysis reassembled: ${allAnalysis.length} total paragraphs from ${processedChunks.length} chunks`);
    
  } else if (typeof processedChunks[0].output === 'string') {
    // Concatenate string outputs
    combinedResult.output = processedChunks
      .map(chunk => chunk.output)
      .join('\n\n---\n\n');
  } else if (Array.isArray(processedChunks[0].output)) {
    // Combine array outputs
    combinedResult.output = processedChunks
      .flatMap(chunk => chunk.output || []);
  } else if (typeof processedChunks[0].output === 'object') {
    // Merge object outputs
    combinedResult.output = processedChunks.reduce((merged, chunk) => {
      return { ...merged, ...chunk.output };
    }, {});
  } else {
    // Fallback to string concatenation
    combinedResult.output = processedChunks
      .map(chunk => String(chunk.output || ''))
      .join('\n\n---\n\n');
  }
  
  return combinedResult;
};
