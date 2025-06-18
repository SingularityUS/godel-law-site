
/**
 * Module Processors Index
 * 
 * Purpose: Centralized exports for all module processors
 */

export { processParagraphSplitter } from './paragraphSplitterProcessor';
export { processGrammarAnalysis } from './grammarAnalysisProcessor';
export { processCitationFinder } from './citationFinderProcessor';

// Export grammar analysis utilities for potential reuse
export { createEmptyAnalysisResult } from './grammarAnalysis/emptyResultCreator';
export { processInputData } from './grammarAnalysis/inputDataProcessor';
export { formatSingleParagraphOutput, formatBatchOutput } from './grammarAnalysis/outputFormatter';
export type { AnalysisResult, ProcessingOptions, GrammarAnalysisInputData } from './grammarAnalysis/types';

// Export citation finder utilities
export type { CitationFinding, CitationFinderResult } from './citationFinderProcessor';
