
/**
 * Grammar Analysis Types
 * 
 * Purpose: Type definitions for grammar analysis processing
 */

export interface GrammarAnalysisInputData {
  id?: string;
  content?: string;
  output?: {
    paragraphs?: any[];
  };
  paragraphs?: any[];
}

export interface ProcessingOptions {
  isSingleParagraphMode: boolean;
  cleanParagraphs: any[];
  originalInputData: any;
}

export interface AnalysisResult {
  output: {
    analysis: any[];
    overallAssessment: {
      totalErrors: number;
      writingQuality: string;
      overallScore: number;
      totalParagraphs: number;
      averageScore: number;
      totalParagraphsProcessed: number;
      recommendations?: string[];
    };
    processingStats?: {
      paragraphsAnalyzed: number;
      totalSuggestions: number;
      averageImprovementsPerParagraph: number;
      averageWordCount: number;
    };
    redliningData?: {
      ready: boolean;
      totalSuggestions: number;
      timestamp: string;
    };
  };
  metadata: {
    processingTime: number;
    method: string;
    redliningReady: boolean;
    positionAware?: boolean;
    handledStringInput?: boolean;
    singleParagraphMode?: boolean;
    originalContent?: string;
    error?: string;
  };
}
