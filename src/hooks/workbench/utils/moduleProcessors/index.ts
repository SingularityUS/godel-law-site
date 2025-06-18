
/**
 * Module Processors Index
 * 
 * Purpose: Central export point for all specialized module processors
 */

export { createGrammarAnalysisProcessor } from './grammarAnalysisProcessor';
export { createParagraphSplitterProcessor } from './paragraphSplitterProcessor';
export { createCitationFinderProcessor } from './citationFinderProcessor';
export type { CitationMatch, CitationFinderOutput } from './citationFinderProcessor';

// Re-export types from grammar analysis
export type { 
  GrammarSuggestion,
  GrammarAnalysisResult,
  GrammarProcessorOutput 
} from './grammarAnalysisProcessor';
