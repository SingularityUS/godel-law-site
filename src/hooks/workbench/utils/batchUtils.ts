
/**
 * Batch Processing Utilities
 * 
 * Purpose: Utility functions for determining batch processing strategies
 */

/**
 * Determine if content should be processed in batches
 */
export const shouldUseBatchProcessing = (data: any): boolean => {
  // Check for chunked documents OR large paragraph arrays
  return (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 1) ||
         (data.paragraphs && Array.isArray(data.paragraphs) && data.paragraphs.length > 1);
};

/**
 * Determine if we should process paragraphs individually
 */
export const shouldProcessParagraphsIndividually = (data: any, moduleType: string): boolean => {
  // Grammar checker should process paragraphs individually for better analysis
  return moduleType === 'grammar-checker' && 
         data.output && 
         Array.isArray(data.output.paragraphs) && 
         data.output.paragraphs.length > 1;
};

/**
 * Process individual paragraph for grammar checking with enhanced context preservation
 */
export const processIndividualParagraph = async (
  paragraph: any, 
  index: number, 
  totalParagraphs: number, 
  documentType: string,
  processingFunction: (content: string) => Promise<any>
) => {
  console.log(`Processing paragraph ${index + 1}/${totalParagraphs}: "${paragraph.content?.substring(0, 50)}..."`);
  
  // Create a focused data structure for individual paragraph with enhanced context
  const paragraphData = {
    paragraph: {
      id: paragraph.id || `para-${index + 1}`,
      content: paragraph.content,
      wordCount: paragraph.wordCount || (paragraph.content ? paragraph.content.split(/\s+/).length : 0),
      originalIndex: index
    },
    context: {
      totalParagraphs: totalParagraphs,
      currentIndex: index,
      documentType: documentType || 'legal',
      isIndividualProcessing: true
    },
    metadata: {
      processingMode: 'individual',
      paragraphId: paragraph.id || `para-${index + 1}`,
      timestamp: new Date().toISOString()
    }
  };
  
  const result = await processingFunction(JSON.stringify(paragraphData, null, 2));
  
  // Enhance result with paragraph context
  if (result && result.output) {
    result.metadata = {
      ...result.metadata,
      originalParagraphIndex: index,
      paragraphId: paragraph.id || `para-${index + 1}`,
      processedIndividually: true
    };
  }
  
  return result;
};

/**
 * Combine analysis results from individual paragraph processing with better data preservation
 */
export const combineAnalysisResults = (results: any[], totalParagraphs: number, moduleType?: string) => {
  const allAnalysis: any[] = [];
  let totalErrors = 0;
  let validResults = 0;
  
  console.log(`Combining ${results.length} individual paragraph results`);
  
  results.forEach((result, index) => {
    if (!result) {
      console.warn(`Result ${index} is null or undefined`);
      return;
    }
    
    if (result.error) {
      console.warn(`Result ${index} contains error:`, result.error);
      return;
    }
    
    if (result.output && result.output.analysis) {
      validResults++;
      
      if (Array.isArray(result.output.analysis)) {
        // Preserve original paragraph metadata in each analysis item
        const enhancedAnalysis = result.output.analysis.map((item: any) => ({
          ...item,
          originalIndex: result.metadata?.originalParagraphIndex || index,
          paragraphId: result.metadata?.paragraphId || item.paragraphId || `para-${index + 1}`,
          processedIndividually: true
        }));
        allAnalysis.push(...enhancedAnalysis);
      } else {
        // Single analysis item
        const enhancedItem = {
          ...result.output.analysis,
          originalIndex: result.metadata?.originalParagraphIndex || index,
          paragraphId: result.metadata?.paragraphId || result.output.analysis.paragraphId || `para-${index + 1}`,
          processedIndividually: true
        };
        allAnalysis.push(enhancedItem);
      }
      
      // Count errors more accurately
      if (result.output.overallAssessment?.totalErrors) {
        totalErrors += result.output.overallAssessment.totalErrors;
      } else if (result.output.analysis.suggestions) {
        totalErrors += Array.isArray(result.output.analysis.suggestions) ? 
          result.output.analysis.suggestions.length : 1;
      }
    } else {
      console.warn(`Result ${index} missing output.analysis:`, result);
    }
  });
  
  console.log(`Successfully combined ${validResults}/${results.length} results into ${allAnalysis.length} analysis items`);
  
  // Calculate enhanced statistics
  const avgScore = allAnalysis.length > 0 ? 
    allAnalysis.reduce((sum, item) => sum + (item.legalWritingScore || 0), 0) / allAnalysis.length : 0;
  
  return {
    moduleType: moduleType,
    output: {
      analysis: allAnalysis,
      processingStats: {
        paragraphsAnalyzed: totalParagraphs,
        paragraphsSuccessful: validResults,
        totalResults: allAnalysis.length,
        processedIndividually: true,
        dataLossCount: totalParagraphs - validResults
      },
      overallAssessment: {
        totalErrors: totalErrors,
        totalParagraphs: totalParagraphs,
        averageScore: Math.round(avgScore * 10) / 10,
        processingSuccess: validResults / totalParagraphs,
        qualityScore: avgScore >= 8 ? "Good" : avgScore >= 6 ? "Fair" : "Needs Improvement"
      }
    },
    metadata: {
      processingTime: Date.now(),
      processedIndividually: true,
      totalParagraphs: totalParagraphs,
      successfulParagraphs: validResults,
      timestamp: new Date().toISOString(),
      combiningComplete: true
    }
  };
};
