
/**
 * Input Data Processor
 * 
 * Purpose: Handles and validates input data for grammar analysis
 */

import { GrammarAnalysisInputData, ProcessingOptions } from './types';

export function processInputData(inputData: any): ProcessingOptions {
  console.log('\n=== GRAMMAR ANALYSIS INPUT PROCESSOR ===');
  console.log('Input data type:', typeof inputData);
  console.log('Input data keys:', inputData ? Object.keys(inputData) : 'null');
  console.log('Full input data structure:', JSON.stringify(inputData, null, 2).substring(0, 500));
  
  let paragraphs: any[] = [];
  let isSingleParagraphMode = false;
  
  // Handle direct string input (individual paragraph content)
  if (typeof inputData === 'string') {
    console.log('Received string input - creating paragraph object from content');
    console.log('String content length:', inputData.length);
    console.log('String content preview:', inputData.substring(0, 100) + '...');
    
    paragraphs = [{
      id: `para-${Date.now()}`,
      content: inputData
    }];
    isSingleParagraphMode = true;
    console.log(`Created single paragraph from string input: ${paragraphs.length} paragraph`);
  } else if (inputData && typeof inputData === 'object') {
    // Handle paragraph object input (from individual processing)
    if (inputData.id && inputData.content) {
      console.log('Received paragraph object input - using directly');
      paragraphs = [inputData];
      isSingleParagraphMode = true;
      console.log(`Using paragraph object directly: ${paragraphs.length} paragraph`);
    } else if (inputData.output && inputData.output.paragraphs && Array.isArray(inputData.output.paragraphs)) {
      paragraphs = inputData.output.paragraphs;
      console.log(`Found ${paragraphs.length} paragraphs in output wrapper`);
    } else if (inputData.paragraphs && Array.isArray(inputData.paragraphs)) {
      paragraphs = inputData.paragraphs;
      console.log(`Found ${paragraphs.length} paragraphs directly`);
    } else if (Array.isArray(inputData)) {
      paragraphs = inputData;
      console.log(`Input data is array of ${paragraphs.length} items`);
    } else {
      console.error('No paragraphs found in input data structure');
      console.log('Available keys:', Object.keys(inputData));
      throw new Error('No paragraphs found in input data structure');
    }
  } else {
    console.error('Input data is not a string or object, or is null');
    throw new Error('Invalid input data format');
  }
  
  if (paragraphs.length === 0) {
    console.warn('No paragraphs to analyze');
    throw new Error('No paragraphs found to analyze');
  }
  
  // Log paragraph details before processing
  console.log('\n--- PARAGRAPH DETAILS ---');
  paragraphs.forEach((para, index) => {
    console.log(`Paragraph ${index + 1}:`, {
      id: para.id,
      hasContent: !!para.content,
      contentLength: para.content?.length || 0,
      contentPreview: para.content?.substring(0, 50) + '...'
    });
  });
  
  // Prepare paragraphs for analysis with validation
  const cleanParagraphs = paragraphs
    .filter(p => {
      const isValid = p.content && typeof p.content === 'string' && p.content.trim().length > 10;
      if (!isValid) {
        console.log(`Filtering out paragraph:`, {
          id: p.id,
          hasContent: !!p.content,
          contentType: typeof p.content,
          contentLength: p.content?.length || 0
        });
      }
      return isValid;
    })
    .map(p => ({
      id: p.id || `para-${Math.random().toString(36).substr(2, 9)}`,
      content: p.content.trim()
    }));
  
  console.log(`\nProcessing ${cleanParagraphs.length} clean paragraphs out of ${paragraphs.length} total`);
  
  if (cleanParagraphs.length === 0) {
    console.warn('No valid paragraphs remaining after filtering');
    throw new Error('No valid paragraphs found after content filtering');
  }
  
  return {
    isSingleParagraphMode,
    cleanParagraphs,
    originalInputData: inputData
  };
}
