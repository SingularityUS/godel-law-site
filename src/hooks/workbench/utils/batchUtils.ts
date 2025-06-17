
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
 * Process individual paragraph for grammar checking
 */
export const processIndividualParagraph = async (
  paragraph: any, 
  index: number, 
  totalParagraphs: number, 
  documentType: string,
  processingFunction: (content: string) => Promise<any>
) => {
  console.log(`Processing paragraph ${index + 1}: "${paragraph.content?.substring(0, 50)}..."`);
  
  // Create a focused data structure for individual paragraph
  const paragraphData = {
    paragraph: paragraph,
    context: {
      totalParagraphs: totalParagraphs,
      currentIndex: index,
      documentType: documentType || 'legal'
    }
  };
  
  return await processingFunction(JSON.stringify(paragraphData, null, 2));
};

/**
 * Combine analysis results from individual paragraph processing
 */
export const combineAnalysisResults = (results: any[], totalParagraphs: number, moduleType?: string) => {
  const allAnalysis: any[] = [];
  let totalErrors = 0;
  
  results.forEach((result, index) => {
    if (result.output && result.output.analysis) {
      if (Array.isArray(result.output.analysis)) {
        allAnalysis.push(...result.output.analysis);
      } else {
        allAnalysis.push(result.output.analysis);
      }
      
      if (result.output.overallAssessment?.totalErrors) {
        totalErrors += result.output.overallAssessment.totalErrors;
      }
    }
  });
  
  return {
    moduleType: moduleType,
    output: {
      analysis: allAnalysis,
      processingStats: {
        paragraphsAnalyzed: totalParagraphs,
        totalResults: allAnalysis.length,
        processedIndividually: true
      },
      overallAssessment: {
        totalErrors: totalErrors,
        totalParagraphs: totalParagraphs,
        averageScore: allAnalysis.length > 0 ? 
          allAnalysis.reduce((sum, item) => sum + (item.legalWritingScore || 0), 0) / allAnalysis.length : 0
      }
    },
    metadata: {
      processingTime: Date.now(),
      processedIndividually: true,
      totalParagraphs: totalParagraphs,
      timestamp: new Date().toISOString()
    }
  };
};
