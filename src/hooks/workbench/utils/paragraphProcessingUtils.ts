
/**
 * Paragraph Processing Utilities
 * 
 * Purpose: Handle individual paragraph processing for grammar checking
 */

/**
 * Process individual paragraph for grammar checking - FIXED to send only text content
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
  
  // FIXED: Send only the paragraph text content, not complex JSON
  // The grammar checker needs plain text, not structured data
  const paragraphText = paragraph.content;
  
  console.log(`Sending paragraph text (${paragraphText.length} chars) to grammar checker for analysis`);
  
  try {
    // Send only the text content to the processing function
    const result = await processingFunction(paragraphText);
    
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
