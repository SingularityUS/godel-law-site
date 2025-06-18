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
  
  // Extract clean original content from input data
  const originalContent = extractCleanOriginalContent(originalInputData);
  console.log('Original content extracted:', originalContent.substring(0, 100) + '...');
  
  // Format as a single analysis item for combineAnalysisResults
  const formattedSingleAnalysis = {
    paragraphId: singleParagraph.paragraphId,
    originalContent: originalContent, // Use clean original content
    original: originalContent,
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
    wordCount: originalContent.split(/\s+/).length,
    hasPositionData: true,
    redliningReady: true
  };
  
  console.log('Single paragraph analysis formatted with clean content');
  
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
        timestamp: analysis.timestamp
      }
    },
    metadata: {
      processingTime: analysis.processingTime,
      method: 'streamlined-individual',
      redliningReady: true,
      positionAware: true,
      handledStringInput: typeof originalInputData === 'string',
      singleParagraphMode: true,
      originalContent: originalContent // Store clean original content
    }
  };
}

export function formatBatchOutput(
  analysis: any,
  paragraphs: any[],
  cleanParagraphs: any[],
  originalInputData: any
): AnalysisResult {
  // Extract clean original content
  const originalContent = extractCleanOriginalContent(originalInputData);
  console.log('Batch processing - original content extracted:', originalContent.substring(0, 100) + '...');
  
  // Convert to expected format for batch processing compatibility
  const formattedAnalysis = analysis.paragraphs.map((para: any, index: number) => {
    console.log(`Formatting paragraph ${para.paragraphId}: ${para.suggestions.length} suggestions`);
    
    // Get the original paragraph content from the clean content
    const paraContent = paragraphs[index]?.content || para.originalContent;
    
    return {
      paragraphId: para.paragraphId,
      originalContent: paraContent, // Use clean paragraph content
      original: paraContent,
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
      wordCount: paraContent.split(/\s+/).length,
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
        timestamp: analysis.timestamp
      }
    },
    metadata: {
      processingTime: analysis.processingTime,
      method: 'streamlined-enhanced',
      redliningReady: true,
      positionAware: true,
      handledStringInput: typeof originalInputData === 'string',
      singleParagraphMode: false,
      originalContent: originalContent // Store clean original content
    }
  };
}

/**
 * Extracts clean original content from input data, filtering out JSON metadata
 */
function extractCleanOriginalContent(inputData: any): string {
  console.log('Extracting clean original content from:', typeof inputData);
  
  // If it's already a string, check for JSON contamination
  if (typeof inputData === 'string') {
    // Remove any JSON-like structures that might have been included
    let cleanContent = inputData.trim();
    
    // Remove JSON objects that start with { and end with }
    cleanContent = cleanContent.replace(/^\s*\{[\s\S]*?\}\s*$/gm, '');
    
    // Remove array structures
    cleanContent = cleanContent.replace(/^\s*\[[\s\S]*?\]\s*$/gm, '');
    
    // Remove key-value pairs like "key": "value"
    cleanContent = cleanContent.replace(/"[^"]*"\s*:\s*"[^"]*",?\s*$/gm, '');
    
    // Remove isolated JSON syntax
    cleanContent = cleanContent.replace(/[{}[\]",]/g, ' ');
    
    // Clean up multiple spaces and newlines
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim();
    
    console.log('Cleaned string content:', cleanContent.substring(0, 100) + '...');
    return cleanContent;
  }
  
  // If it's an object, look for content properties
  if (typeof inputData === 'object' && inputData !== null) {
    // Check common content properties
    const contentKeys = ['content', 'text', 'originalContent', 'input'];
    
    for (const key of contentKeys) {
      if (inputData[key] && typeof inputData[key] === 'string') {
        console.log(`Found content in ${key} property`);
        return inputData[key].trim();
      }
    }
    
    // If it's an array, join the content
    if (Array.isArray(inputData)) {
      const textContent = inputData
        .filter(item => typeof item === 'string')
        .join(' ')
        .trim();
      
      if (textContent) {
        console.log('Extracted content from array');
        return textContent;
      }
    }
    
    // Try to stringify and extract meaningful text
    const stringified = JSON.stringify(inputData);
    return extractCleanOriginalContent(stringified);
  }
  
  console.warn('Could not extract clean content, using fallback');
  return 'Document content could not be extracted';
}
