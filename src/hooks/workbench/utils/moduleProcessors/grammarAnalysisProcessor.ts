/**
 * Grammar Analysis Processor
 * 
 * Purpose: Handles streamlined grammar analysis with enhanced debugging and position mapping
 */

import { analyzeDocument } from '../streamlinedGrammarAnalyzer';

export const processGrammarAnalysis = async (
  inputData: any,
  callGPT: (prompt: string, systemPrompt?: string, model?: string, maxTokens?: number) => Promise<any>,
  onProgress?: (completed: number, total: number) => void
): Promise<any> => {
  console.log('\n=== GRAMMAR ANALYSIS PROCESSOR (Enhanced Debug) ===');
  console.log('Input data type:', typeof inputData);
  console.log('Input data keys:', inputData ? Object.keys(inputData) : 'null');
  console.log('Full input data structure:', JSON.stringify(inputData, null, 2).substring(0, 500));
  
  // Extract paragraphs from input with enhanced debugging
  let paragraphs: any[] = [];
  let isSingleParagraphMode = false;
  
  // FIXED: Handle direct string input (individual paragraph content)
  if (typeof inputData === 'string') {
    console.log('Received string input - creating paragraph object from content');
    console.log('String content length:', inputData.length);
    console.log('String content preview:', inputData.substring(0, 100) + '...');
    
    // Create a paragraph object from the string content
    paragraphs = [{
      id: `para-${Date.now()}`,
      content: inputData
    }];
    isSingleParagraphMode = true;
    console.log(`Created single paragraph from string input: ${paragraphs.length} paragraph`);
  } else if (inputData && typeof inputData === 'object') {
    // FIXED: Handle paragraph object input (from individual processing)
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
      return createEmptyAnalysisResult('No paragraphs found in input data structure');
    }
  } else {
    console.error('Input data is not a string or object, or is null');
    return createEmptyAnalysisResult('Invalid input data format');
  }
  
  if (paragraphs.length === 0) {
    console.warn('No paragraphs to analyze');
    return createEmptyAnalysisResult('No paragraphs found to analyze');
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
    return createEmptyAnalysisResult('No valid paragraphs found after content filtering');
  }
  
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
  
  // FIXED: Format output differently for single paragraph vs batch processing
  if (isSingleParagraphMode && analysis.paragraphs.length > 0) {
    console.log('\n--- SINGLE PARAGRAPH MODE: Formatting for individual processing ---');
    const singleParagraph = analysis.paragraphs[0];
    
    // Format as a single analysis item for combineAnalysisResults
    const formattedSingleAnalysis = {
      paragraphId: singleParagraph.paragraphId,
      original: singleParagraph.originalContent,
      corrected: singleParagraph.suggestions.length > 0 ? 
        'See suggestions for improvements' : 
        'No changes needed',
      suggestions: singleParagraph.suggestions.map(sug => ({
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
        }
      },
      metadata: {
        processingTime: analysis.processingTime,
        method: 'streamlined-individual',
        redliningReady: true,
        positionAware: true,
        handledStringInput: typeof inputData === 'string',
        singleParagraphMode: true
      }
    };
  } else {
    // Convert to expected format for batch processing compatibility
    const formattedAnalysis = analysis.paragraphs.map(para => {
      console.log(`Formatting paragraph ${para.paragraphId}: ${para.suggestions.length} suggestions`);
      return {
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
        Math.round(cleanParagraphs.reduce((sum, p) => sum + p.content.split(/\s+/).length, 0) / cleanParagraphs.length) : 0
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
          timestamp: analysis.timestamp
        }
      },
      metadata: {
        processingTime: analysis.processingTime,
        method: 'streamlined-enhanced',
        redliningReady: true,
        positionAware: true,
        handledStringInput: typeof inputData === 'string',
        singleParagraphMode: false
      }
    };
  }
};

/**
 * Helper function to create empty analysis result
 */
function createEmptyAnalysisResult(reason: string) {
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
