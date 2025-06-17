
/**
 * Grammar Analysis Processor
 * 
 * Purpose: Handles streamlined grammar analysis with position mapping
 */

import { analyzeDocument } from '../streamlinedGrammarAnalyzer';

export const processGrammarAnalysis = async (
  inputData: any,
  callGPT: (systemPrompt: string, userInput: string) => Promise<any>,
  onProgress?: (completed: number, total: number) => void
): Promise<any> => {
  console.log('=== GRAMMAR ANALYSIS PROCESSOR (Streamlined) ===');
  console.log('Input data type:', typeof inputData);
  
  // Extract paragraphs from input
  let paragraphs: any[] = [];
  
  if (inputData && typeof inputData === 'object') {
    if (inputData.output && inputData.output.paragraphs && Array.isArray(inputData.output.paragraphs)) {
      paragraphs = inputData.output.paragraphs;
      console.log(`Found ${paragraphs.length} paragraphs in output wrapper`);
    } else if (inputData.paragraphs && Array.isArray(inputData.paragraphs)) {
      paragraphs = inputData.paragraphs;
      console.log(`Found ${paragraphs.length} paragraphs directly`);
    } else {
      console.error('No paragraphs found in input data structure');
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
            recommendations: ["No content found to analyze"]
          },
          processingStats: {
            paragraphsAnalyzed: 0,
            totalSuggestions: 0,
            averageImprovementsPerParagraph: 0,
            averageWordCount: 0
          }
        }
      };
    }
  }
  
  if (paragraphs.length === 0) {
    console.warn('No paragraphs to analyze');
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
          recommendations: ["No paragraphs found to analyze"]
        },
        processingStats: {
          paragraphsAnalyzed: 0,
          totalSuggestions: 0,
          averageImprovementsPerParagraph: 0,
          averageWordCount: 0
        }
      }
    };
  }
  
  // Prepare paragraphs for analysis
  const cleanParagraphs = paragraphs
    .filter(p => p.content && p.content.trim().length > 10)
    .map(p => ({
      id: p.id || `para-${Math.random().toString(36).substr(2, 9)}`,
      content: p.content.trim()
    }));
  
  console.log(`Analyzing ${cleanParagraphs.length} clean paragraphs`);
  
  // Perform streamlined analysis
  const analysis = await analyzeDocument(cleanParagraphs, callGPT, onProgress);
  
  // Convert to expected format for compatibility
  const formattedAnalysis = analysis.paragraphs.map(para => ({
    paragraphId: para.paragraphId,
    original: para.originalContent,
    corrected: para.suggestions.length > 0 ? 
      'See suggestions for improvements' : 
      'No changes needed',
    suggestions: para.suggestions.map(sug => ({
      type: sug.type,
      severity: sug.severity,
      originalText: sug.originalText,
      suggestedText: sug.suggestedText,
      explanation: sug.explanation,
      position: {
        start: sug.startPos,
        end: sug.endPos
      }
    })),
    legalWritingScore: para.overallScore,
    improvementSummary: para.suggestions.length > 0 ? 
      `${para.suggestions.length} suggestions for improvement` : 
      'Writing is clear and correct',
    wordCount: para.originalContent.split(/\s+/).length,
    // Include position data for redlining
    hasPositionData: true,
    redliningReady: true
  }));
  
  const overallAssessment = {
    totalErrors: analysis.totalSuggestions,
    writingQuality: analysis.averageScore >= 8 ? "Excellent" : 
                   analysis.averageScore >= 6 ? "Good" : 
                   analysis.averageScore >= 4 ? "Fair" : "Needs Improvement",
    overallScore: Math.round(analysis.averageScore * 10) / 10,
    totalParagraphs: paragraphs.length,
    averageScore: Math.round(analysis.averageScore * 10) / 10,
    totalParagraphsProcessed: cleanParagraphs.length,
    recommendations: [
      analysis.totalSuggestions > 0 ? 
        `Review ${analysis.totalSuggestions} suggestions for improvement` :
        "Document writing quality is good",
      "Use redlining interface to apply changes",
      "Focus on high-severity suggestions first"
    ]
  };
  
  const processingStats = {
    paragraphsAnalyzed: cleanParagraphs.length,
    totalSuggestions: analysis.totalSuggestions,
    averageImprovementsPerParagraph: cleanParagraphs.length > 0 ? 
      Math.round((analysis.totalSuggestions / cleanParagraphs.length) * 10) / 10 : 0,
    averageWordCount: cleanParagraphs.length > 0 ?
      Math.round(cleanParagraphs.reduce((sum, p) => sum + p.content.split(/\s+/).length, 0) / cleanParagraphs.length) : 0
  };
  
  console.log(`Grammar analysis complete: ${analysis.totalSuggestions} suggestions across ${cleanParagraphs.length} paragraphs`);
  
  return {
    output: {
      analysis: formattedAnalysis,
      overallAssessment,
      processingStats,
      redliningData: {
        ready: true,
        totalSuggestions: analysis.totalSuggestions,
        timestamp: analysis.timestamp
      }
    },
    metadata: {
      processingTime: analysis.processingTime,
      method: 'streamlined',
      redliningReady: true,
      positionAware: true
    }
  };
};
