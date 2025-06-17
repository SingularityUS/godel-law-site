
/**
 * Grammar Analysis Processor
 * 
 * Purpose: Handles streamlined grammar analysis with enhanced debugging and position mapping
 */

import { analyzeDocument } from '../streamlinedGrammarAnalyzer';
import { processInputData } from './grammarAnalysis/inputDataProcessor';
import { createEmptyAnalysisResult } from './grammarAnalysis/emptyResultCreator';
import { formatSingleParagraphOutput, formatBatchOutput } from './grammarAnalysis/outputFormatter';

export const processGrammarAnalysis = async (
  inputData: any,
  callGPT: (prompt: string, systemPrompt?: string, model?: string, maxTokens?: number) => Promise<any>,
  onProgress?: (completed: number, total: number) => void
): Promise<any> => {
  console.log('\n=== GRAMMAR ANALYSIS PROCESSOR (Enhanced Debug) ===');
  
  try {
    // Process and validate input data
    const { isSingleParagraphMode, cleanParagraphs, originalInputData } = processInputData(inputData);
    
    // Enhanced progress callback with detailed logging
    const enhancedProgressCallback = (completed: number, total: number) => {
      console.log(`Grammar analysis progress: ${completed}/${total} paragraphs (${Math.round(completed/total*100)}%)`);
      if (onProgress) {
        onProgress(completed, total);
      }
    };
    
    // Perform streamlined analysis with enhanced debugging
    console.log('\n--- STARTING CHATGPT ANALYSIS ---');
    const analysis = await analyzeDocument(cleanParagraphs, callGPT, enhancedProgressCallback);
    
    console.log('\n--- ANALYSIS RESULTS ---');
    console.log('Total suggestions generated:', analysis.totalSuggestions);
    console.log('Average score:', analysis.averageScore);
    console.log('Processing time:', analysis.processingTime, 'ms');
    
    // Format output differently for single paragraph vs batch processing
    if (isSingleParagraphMode && analysis.paragraphs.length > 0) {
      return formatSingleParagraphOutput(analysis, originalInputData);
    } else {
      return formatBatchOutput(analysis, inputData.paragraphs || [], cleanParagraphs, originalInputData);
    }
    
  } catch (error: any) {
    console.error('Grammar analysis processing error:', error);
    return createEmptyAnalysisResult(error.message || 'Processing failed');
  }
};
