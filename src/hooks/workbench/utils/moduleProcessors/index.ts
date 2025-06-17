
/**
 * Module Processors Index
 * 
 * Purpose: Centralized exports for all module processors
 */

export { processParagraphSplitter } from './paragraphSplitterProcessor';
export { processGrammarAnalysis } from './grammarAnalysisProcessor';

// Export grammar analysis utilities for potential reuse
export { createEmptyAnalysisResult } from './grammarAnalysis/emptyResultCreator';
export { processInputData } from './grammarAnalysis/inputDataProcessor';
export { formatSingleParagraphOutput, formatBatchOutput } from './grammarAnalysis/outputFormatter';
export type { AnalysisResult, ProcessingOptions, GrammarAnalysisInputData } from './grammarAnalysis/types';
