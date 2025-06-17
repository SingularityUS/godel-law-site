
/**
 * Grammar JSON Parser
 * 
 * Purpose: Handles direct JSON parsing for structured grammar responses
 */

import { GrammarAnalysisItem, GrammarOverallAssessment, GrammarProcessingStats } from './grammarDataExtractor';

export const parseDirectJson = (responseText: string): {
  analysis: GrammarAnalysisItem[];
  overallAssessment: GrammarOverallAssessment;
  processingStats: GrammarProcessingStats;
} | null => {
  console.log('Attempting direct JSON parsing for grammar response');
  
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.analysis) {
      // Handle both single analysis and array of analysis
      const analysis = Array.isArray(parsed.analysis) ? parsed.analysis : [parsed.analysis];
      console.log(`Direct JSON parsing successful: ${analysis.length} items analyzed`);
      
      const overallAssessment = parsed.overallAssessment || {
        totalErrors: analysis.reduce((sum: number, item: any) => sum + (item.suggestions?.length || 0), 0),
        averageScore: analysis.length > 0 ? 
          analysis.reduce((sum: number, item: any) => sum + (item.legalWritingScore || 0), 0) / analysis.length : 0,
        writingQuality: "Unknown",
        overallScore: 0,
        totalParagraphs: analysis.length,
        totalParagraphsProcessed: analysis.length,
        recommendations: []
      };
      
      const processingStats = parsed.processingStats || {
        paragraphsAnalyzed: analysis.length,
        totalSuggestions: analysis.reduce((sum: number, item: any) => sum + (item.suggestions?.length || 0), 0),
        averageImprovementsPerParagraph: 0,
        averageWordCount: 0
      };
      
      return {
        analysis,
        overallAssessment,
        processingStats
      };
    }
  } catch (error) {
    console.warn('Direct JSON parsing failed:', error);
  }
  
  return null;
};

export const extractJsonFromText = (responseText: string): {
  analysis: GrammarAnalysisItem[];
  overallAssessment: GrammarOverallAssessment;
  processingStats: GrammarProcessingStats;
} | null => {
  console.log('Attempting JSON extraction from text response');
  
  const jsonPatterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /\{[\s\S]*"analysis"[\s\S]*\}/,
    /\{[\s\S]*\}/
  ];
  
  for (const pattern of jsonPatterns) {
    const match = responseText.match(pattern);
    if (match) {
      const jsonString = match[1] || match[0];
      try {
        const parsed = JSON.parse(jsonString.trim());
        if (parsed.analysis) {
          const analysis = Array.isArray(parsed.analysis) ? parsed.analysis : [parsed.analysis];
          console.log(`JSON extraction successful: ${analysis.length} items analyzed`);
          
          const overallAssessment = parsed.overallAssessment || {
            totalErrors: analysis.reduce((sum: number, item: any) => sum + (item.suggestions?.length || 0), 0),
            averageScore: analysis.length > 0 ? 
              analysis.reduce((sum: number, item: any) => sum + (item.legalWritingScore || 0), 0) / analysis.length : 0,
            writingQuality: "Unknown",
            overallScore: 0,
            totalParagraphs: analysis.length,
            totalParagraphsProcessed: analysis.length,
            recommendations: []
          };
          
          return {
            analysis,
            overallAssessment,
            processingStats: {
              paragraphsAnalyzed: analysis.length,
              totalSuggestions: analysis.reduce((sum: number, item: any) => sum + (item.suggestions?.length || 0), 0),
              averageImprovementsPerParagraph: 0,
              averageWordCount: 0
            }
          };
        }
      } catch (parseError) {
        continue;
      }
    }
  }
  
  return null;
};
