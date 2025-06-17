
/**
 * Batch Processing Utilities
 * 
 * Purpose: Utility functions for determining batch processing strategies with enhanced validation
 */

/**
 * Determine if content should be processed in batches
 */
export const shouldUseBatchProcessing = (data: any): boolean => {
  if (!data) return false;
  
  // Check for chunked documents OR large paragraph arrays
  const hasChunks = data.chunks && Array.isArray(data.chunks) && data.chunks.length > 1;
  const hasMultipleParagraphs = data.paragraphs && Array.isArray(data.paragraphs) && data.paragraphs.length > 1;
  const hasOutputParagraphs = data.output && Array.isArray(data.output.paragraphs) && data.output.paragraphs.length > 1;
  
  const shouldBatch = hasChunks || hasMultipleParagraphs || hasOutputParagraphs;
  console.log(`Batch processing check:`, {
    hasChunks,
    hasMultipleParagraphs,
    hasOutputParagraphs,
    shouldBatch
  });
  
  return shouldBatch;
};

/**
 * Determine if we should process paragraphs individually with enhanced validation
 */
export const shouldProcessParagraphsIndividually = (data: any, moduleType: string): boolean => {
  if (!data || moduleType !== 'grammar-checker') return false;
  
  // Enhanced validation for grammar checker individual processing
  const hasOutputParagraphs = data.output && 
                             Array.isArray(data.output.paragraphs) && 
                             data.output.paragraphs.length > 1;
  
  const hasParagraphs = Array.isArray(data.paragraphs) && data.paragraphs.length > 1;
  
  const shouldProcessIndividually = hasOutputParagraphs || hasParagraphs;
  
  console.log(`Individual paragraph processing check for ${moduleType}:`, {
    hasOutputParagraphs: hasOutputParagraphs ? data.output.paragraphs.length : 0,
    hasParagraphs: hasParagraphs ? data.paragraphs.length : 0,
    shouldProcessIndividually
  });
  
  return shouldProcessIndividually;
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
  
  // Validate paragraph data
  if (!paragraph || !paragraph.content) {
    console.error(`Invalid paragraph data at index ${index}:`, paragraph);
    return {
      error: `Invalid paragraph data at index ${index}`,
      paragraphIndex: index,
      outputGenerated: 0
    };
  }
  
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
      isIndividualProcessing: true,
      processingMode: 'individual'
    },
    metadata: {
      processingMode: 'individual',
      paragraphId: paragraph.id || `para-${index + 1}`,
      timestamp: new Date().toISOString(),
      originalParagraph: paragraph
    }
  };
  
  try {
    const result = await processingFunction(JSON.stringify(paragraphData, null, 2));
    
    // Enhance result with paragraph context and validation
    if (result && result.output) {
      result.metadata = {
        ...result.metadata,
        originalParagraphIndex: index,
        paragraphId: paragraph.id || `para-${index + 1}`,
        processedIndividually: true,
        originalWordCount: paragraph.wordCount,
        processingSuccess: true
      };
      
      console.log(`✅ Paragraph ${index + 1} processed successfully`);
    } else {
      console.warn(`⚠️ Paragraph ${index + 1} processing returned invalid result:`, result);
      result.metadata = {
        ...result.metadata,
        originalParagraphIndex: index,
        paragraphId: paragraph.id || `para-${index + 1}`,
        processedIndividually: true,
        processingSuccess: false,
        error: 'Invalid processing result'
      };
    }
    
    return result;
  } catch (error) {
    console.error(`Error processing paragraph ${index + 1}:`, error);
    return {
      error: `Failed to process paragraph ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      paragraphIndex: index,
      outputGenerated: 0,
      metadata: {
        originalParagraphIndex: index,
        paragraphId: paragraph.id || `para-${index + 1}`,
        processedIndividually: true,
        processingSuccess: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

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
          processingSuccess: result.metadata?.processingSuccess ?? true
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
          processingSuccess: result.metadata?.processingSuccess ?? true
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
