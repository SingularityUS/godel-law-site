
/**
 * Empty Result Creator
 * 
 * Purpose: Creates empty analysis results for error cases
 */

import { AnalysisResult } from './types';

export function createEmptyAnalysisResult(reason: string): AnalysisResult {
  console.log('Creating empty analysis result:', reason);
  return {
    output: {
      analysis: [],
      overallAssessment: {
        totalErrors: 0,
        writingQuality: "No Content",
        overallScore: 0,
        totalParagraphs: 0,
        averageScore: 0,
        totalParagraphsProcessed: 0,
        recommendations: [reason]
      },
      processingStats: {
        paragraphsAnalyzed: 0,
        totalSuggestions: 0,
        averageImprovementsPerParagraph: 0,
        averageWordCount: 0
      },
      redliningData: {
        ready: false,
        totalSuggestions: 0,
        timestamp: new Date().toISOString()
      }
    },
    metadata: {
      processingTime: 0,
      method: 'empty-result',
      redliningReady: false,
      error: reason
    }
  };
}
