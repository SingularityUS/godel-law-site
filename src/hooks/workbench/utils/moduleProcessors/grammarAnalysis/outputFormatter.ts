
/**
 * Output Formatter
 * 
 * Purpose: Formats grammar analysis results for different processing modes
 */

import { AnalysisResult } from './types';

export function formatSingleParagraphOutput(
  analysis: any,
  originalInputData: any
): AnalysisResult {
  console.log('\n--- SINGLE PARAGRAPH MODE: Formatting for individual processing ---');
  const singleParagraph = analysis.paragraphs[0];
  
  // Format as a single analysis item for combineAnalysisResults
  const formattedSingleAnalysis = {
    paragraphId: singleParagraph.paragraphId,
    original: singleParagraph.originalContent,
    corrected: singleParagraph.suggestions.length > 0 ? 
      'See suggestions for improvements' : 
      'No changes needed',
    suggestions: singleParagraph.suggestions.map((sug: any) => ({
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
    legalWritingScore: singleParagraph.overallScore,
    improvementSummary: singleParagraph.suggestions.length > 0 ? 
      `${singleParagraph.suggestions.length} suggestions for improvement` : 
      'Writing is clear and correct',
    wordCount: singleParagraph.originalContent.split(/\s+/).length,
    hasPositionData: true,
    redliningReady: true
  };
  
  console.log('Single paragraph analysis formatted:', {
    paragraphId: formattedSingleAnalysis.paragraphId,
    suggestionsCount: formattedSingleAnalysis.suggestions.length,
    score: formattedSingleAnalysis.legalWritingScore
  });
  
  // Return format expected by combineAnalysisResults (analysis as array)
  return {
    output: {
      analysis: [formattedSingleAnalysis], // Array with single item
      overallAssessment: {
        totalErrors: analysis.totalSuggestions,
        writingQuality: analysis.averageScore >= 8 ? "Excellent" : 
                       analysis.averageScore >= 6 ? "Good" : 
                       analysis.averageScore >= 4 ? "Fair" : "Needs Improvement",
        overallScore: Math.round(analysis.averageScore * 10) / 10,
        totalParagraphs: 1,
        averageScore: Math.round(analysis.averageScore * 10) / 10,
        totalParagraphsProcessed: 1
      },
      redliningData: {
        ready: true,
        totalSuggestions: analysis.totalSuggestions,
        timestamp: analysis.timestamp,
        hasPositionData: true
      }
    },
    metadata: {
      processingTime: analysis.processingTime,
      method: 'streamlined-individual',
      redliningReady: true,
      positionAware: true,
      handledStringInput: typeof originalInputData === 'string',
      singleParagraphMode: true
    }
  };
}

export function formatBatchOutput(
  analysis: any,
  paragraphs: any[],
  cleanParagraphs: any[],
  originalInputData: any
): AnalysisResult {
  // Convert to expected format for batch processing compatibility
  const formattedAnalysis = analysis.paragraphs.map((para: any) => {
    console.log(`Formatting paragraph ${para.paragraphId}: ${para.suggestions.length} suggestions`);
    return {
      paragraphId: para.paragraphId,
      original: para.originalContent,
      corrected: para.suggestions.length > 0 ? 
        'See suggestions for improvements' : 
        'No changes needed',
      suggestions: para.suggestions.map((sug: any) => ({
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
      hasPositionData: true,
      redliningReady: true
    };
  });
  
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
      Math.round(cleanParagraphs.reduce((sum: number, p: any) => sum + p.content.split(/\s+/).length, 0) / cleanParagraphs.length) : 0
  };
  
  console.log('\n=== GRAMMAR ANALYSIS PROCESSOR COMPLETE ===');
  console.log(`Final result: ${analysis.totalSuggestions} suggestions across ${cleanParagraphs.length} paragraphs`);
  
  return {
    output: {
      analysis: formattedAnalysis,
      overallAssessment,
      processingStats,
      redliningData: {
        ready: true,
        totalSuggestions: analysis.totalSuggestions,
        timestamp: analysis.timestamp,
        hasPositionData: true
      }
    },
    metadata: {
      processingTime: analysis.processingTime,
      method: 'streamlined-enhanced',
      redliningReady: true,
      positionAware: true,
      handledStringInput: typeof originalInputData === 'string',
      singleParagraphMode: false
    }
  };
}
