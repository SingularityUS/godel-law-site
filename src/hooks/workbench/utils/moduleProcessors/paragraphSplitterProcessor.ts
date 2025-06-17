
/**
 * Paragraph Splitter Processor
 * 
 * Purpose: Handles paragraph splitting using deterministic method
 */

import { splitDocumentIntoParagraphs } from '../deterministicParagraphSplitter';

export const processParagraphSplitter = async (inputData: any): Promise<any> => {
  console.log('=== PARAGRAPH SPLITTER PROCESSOR (Deterministic) ===');
  console.log('Input data type:', typeof inputData);
  
  // Extract clean content from input
  let content: string = '';
  
  if (typeof inputData === 'string') {
    content = inputData;
  } else if (inputData && typeof inputData === 'object') {
    // Prioritize processable content for clean splitting
    if (inputData.processableContent && typeof inputData.processableContent === 'string') {
      content = inputData.processableContent;
      console.log('Using processable content for splitting');
    } else if (inputData.originalContent && typeof inputData.originalContent === 'string') {
      content = inputData.originalContent;
      console.log('Using original content for splitting');
    } else if (inputData.content && typeof inputData.content === 'string') {
      content = inputData.content;
      console.log('Using content property for splitting');
    } else {
      console.error('No usable content found in input data');
      return {
        output: {
          paragraphs: [],
          totalParagraphs: 0,
          documentType: 'legal',
          error: 'No content found to split'
        }
      };
    }
  }
  
  if (!content || content.trim().length === 0) {
    console.warn('Empty content provided to paragraph splitter');
    return {
      output: {
        paragraphs: [],
        totalParagraphs: 0,
        documentType: 'legal',
        error: 'Empty content'
      }
    };
  }
  
  console.log(`Splitting content (${content.length} characters) using deterministic method`);
  
  // Use deterministic splitting
  const result = splitDocumentIntoParagraphs(content);
  
  // Convert to expected format
  const formattedParagraphs = result.paragraphs.map(para => ({
    id: para.id,
    content: para.content,
    wordCount: para.wordCount,
    type: para.type,
    sectionNumber: para.sectionNumber || '',
    // Include position information for redlining
    originalStart: para.originalStart,
    originalEnd: para.originalEnd
  }));
  
  console.log(`Deterministic splitting complete: ${formattedParagraphs.length} paragraphs`);
  
  return {
    output: {
      paragraphs: formattedParagraphs,
      totalParagraphs: formattedParagraphs.length,
      documentType: 'legal',
      splitMethod: 'deterministic',
      originalLength: result.originalLength,
      preservesPositions: true
    },
    metadata: {
      processingTime: Date.now(),
      method: 'deterministic',
      inputLength: content.length,
      outputParagraphs: formattedParagraphs.length
    }
  };
};
