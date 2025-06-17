
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
 * Reassemble processed chunks into a single result
 */
export const reassembleChunks = (processedChunks: any[]): any => {
  if (processedChunks.length === 1) {
    return processedChunks[0];
  }
  
  // Combine results from multiple chunks
  const combinedResult = {
    moduleType: processedChunks[0].moduleType,
    output: null as any, // Use any type to handle different output types
    metadata: {
      totalChunks: processedChunks.length,
      combinedResults: true,
      processingTime: processedChunks.reduce((total, chunk) => 
        total + (chunk.metadata?.processingTime || 0), 0
      ),
      timestamp: new Date().toISOString()
    }
  };
  
  // Handle different output types
  if (typeof processedChunks[0].output === 'string') {
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
