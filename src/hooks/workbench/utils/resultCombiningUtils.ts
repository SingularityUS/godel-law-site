
/**
 * Result Combining Utilities
 * 
 * Purpose: Combine analysis results from individual paragraph processing
 */

/**
 * Combine analysis results from individual paragraph processing with enhanced validation and data preservation
 */
export const combineAnalysisResults = (results: any[], totalParagraphs: number, moduleType?: string) => {
  const allAnalysis: any[] = [];
  let totalErrors = 0;
  let validResults = 0;
  let dataLossCount = 0;
  
  console.log(`Combining ${results.length} individual paragraph results for ${totalParagraphs} total paragraphs`);
  
  results.forEach((result, index) => {
    if (!result) {
      console.warn(`Result ${index} is null or undefined`);
      dataLossCount++;
      return;
    }
    
    if (result.error) {
      console.warn(`Result ${index} contains error:`, result.error);
      dataLossCount++;
      return;
    }
    
    if (result.output && result.output.analysis) {
      validResults++;
      
      if (Array.isArray(result.output.analysis)) {
        // Preserve original paragraph metadata in each analysis item
        const enhancedAnalysis = result.output.analysis.map((item: any) => ({
          ...item,
          originalIndex: result.metadata?.originalParagraphIndex ?? index,
          paragraphId: result.metadata?.paragraphId || item.paragraphId || `para-${index + 1}`,
          processedIndividually: true,
          processingSuccess: result.metadata?.processingSuccess ?? true,
          originalContent: result.metadata?.originalParagraphContent // Add original content reference
        }));
        allAnalysis.push(...enhancedAnalysis);
        
        // Count errors from each analysis item
        enhancedAnalysis.forEach(item => {
          if (item.suggestions && Array.isArray(item.suggestions)) {
            totalErrors += item.suggestions.length;
          }
        });
      } else {
        // Single analysis item
        const enhancedItem = {
          ...result.output.analysis,
          originalIndex: result.metadata?.originalParagraphIndex ?? index,
          paragraphId: result.metadata?.paragraphId || result.output.analysis.paragraphId || `para-${index + 1}`,
          processedIndividually: true,
          processingSuccess: result.metadata?.processingSuccess ?? true,
          originalContent: result.metadata?.originalParagraphContent
        };
        allAnalysis.push(enhancedItem);
        
        // Count errors from suggestions
        if (enhancedItem.suggestions && Array.isArray(enhancedItem.suggestions)) {
          totalErrors += enhancedItem.suggestions.length;
        }
      }
      
      // Count errors from overall assessment
      if (result.output.overallAssessment?.totalErrors) {
        totalErrors += result.output.overallAssessment.totalErrors;
      }
    } else {
      console.warn(`Result ${index} missing output.analysis:`, result);
      dataLossCount++;
    }
  });
  
  console.log(`✅ Successfully combined ${validResults}/${results.length} results into ${allAnalysis.length} analysis items`);
  if (dataLossCount > 0) {
    console.warn(`⚠️ Data loss detected: ${dataLossCount} paragraphs failed to process`);
  }
  
  // Calculate enhanced statistics
  const avgScore = allAnalysis.length > 0 ? 
    allAnalysis.reduce((sum, item) => sum + (item.legalWritingScore || 0), 0) / allAnalysis.length : 0;
  
  const processingSuccessRate = validResults / totalParagraphs;
  
  return {
    moduleType: moduleType,
    output: {
      analysis: allAnalysis,
      processingStats: {
        paragraphsAnalyzed: totalParagraphs,
        paragraphsSuccessful: validResults,
        totalResults: allAnalysis.length,
        processedIndividually: true,
        dataLossCount: dataLossCount,
        processingSuccessRate: Math.round(processingSuccessRate * 100) / 100,
        totalSuggestions: totalErrors
      },
      overallAssessment: {
        totalErrors: totalErrors,
        totalParagraphs: totalParagraphs,
        averageScore: Math.round(avgScore * 10) / 10,
        processingSuccess: processingSuccessRate,
        qualityScore: avgScore >= 8 ? "Good" : avgScore >= 6 ? "Fair" : "Needs Improvement",
        dataIntegrityStatus: dataLossCount === 0 ? "Complete" : `${dataLossCount} paragraphs lost`,
        successfullyProcessed: validResults
      }
    },
    metadata: {
      processingTime: Date.now(),
      processedIndividually: true,
      totalParagraphs: totalParagraphs,
      successfulParagraphs: validResults,
      failedParagraphs: dataLossCount,
      timestamp: new Date().toISOString(),
      combiningComplete: true,
      dataIntegrity: dataLossCount === 0 ? 'preserved' : 'partial-loss'
    }
  };
};
