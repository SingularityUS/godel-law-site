
/**
 * Paragraph Processing Utilities
 * 
 * Purpose: Handle individual paragraph processing for grammar checking
 */

/**
 * Process individual paragraph for grammar checking - FIXED to send full paragraph object
 */
export const processIndividualParagraph = async (
  paragraph: any, 
  index: number, 
  totalParagraphs: number, 
  documentType: string,
  processingFunction: (paragraphData: any) => Promise<any>
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
  
  // FIXED: Send the full paragraph object, not just the text content
  // Create a properly structured paragraph object for the grammar checker
  const paragraphData = {
    id: paragraph.id || `para-${index + 1}`,
    content: paragraph.content,
    wordCount: paragraph.wordCount || paragraph.content.split(/\s+/).length,
    originalIndex: index
  };
  
  console.log(`Sending full paragraph object for analysis:`, {
    id: paragraphData.id,
    contentLength: paragraphData.content.length,
    wordCount: paragraphData.wordCount
  });
  
  try {
    // Send the full paragraph object to the processing function
    const result = await processingFunction(paragraphData);
    
    // Enhance result with paragraph context and validation
    if (result && result.output) {
      result.metadata = {
        ...result.metadata,
        originalParagraphIndex: index,
        paragraphId: paragraph.id || `para-${index + 1}`,
        processedIndividually: true,
        originalWordCount: paragraph.wordCount,
        processingSuccess: true,
        originalParagraphContent: paragraph.content // Preserve original content
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
