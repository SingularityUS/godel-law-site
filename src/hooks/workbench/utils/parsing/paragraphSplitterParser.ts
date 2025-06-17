
/**
 * Paragraph Splitter Response Parser Utility
 * 
 * Purpose: Specialized parsing for paragraph splitter responses with enhanced error handling
 */

export const parseParagraphSplitterResponse = (response: any): any => {
  console.log('Parsing paragraph splitter response, type:', typeof response, 'length:', typeof response === 'string' ? response.length : 'N/A');
  
  // Handle ChatGPT API response structure where actual JSON is nested in response.response
  let responseString: string;
  
  if (typeof response === 'object' && response !== null) {
    // Check if this is a ChatGPT API response object with nested response
    if ('response' in response && typeof response.response === 'string') {
      responseString = response.response;
      console.log('Extracted JSON from ChatGPT API response object');
    } else if ('rawResponse' in response && response.rawResponse && 'response' in response.rawResponse) {
      responseString = response.rawResponse.response;
      console.log('Extracted JSON from nested rawResponse object');
    } else if (response.paragraphs && Array.isArray(response.paragraphs)) {
      // If response is already parsed, check if it has paragraphs
      console.log(`Response already parsed: ${response.paragraphs.length} paragraphs found`);
      return {
        output: {
          paragraphs: response.paragraphs,
          totalParagraphs: response.paragraphs.length,
          documentType: response.documentType || 'legal'
        }
      };
    } else {
      responseString = JSON.stringify(response);
    }
  } else if (typeof response === 'string') {
    responseString = response;
  } else if (response === null || response === undefined) {
    console.error('Response is null/undefined for paragraph splitter');
    return {
      output: {
        paragraphs: [],
        totalParagraphs: 0,
        documentType: 'legal',
        error: 'No response received'
      }
    };
  } else {
    responseString = String(response);
    console.warn('Converting non-string response to string for paragraph splitter');
  }
  
  // Try direct JSON parsing first
  try {
    const parsed = JSON.parse(responseString);
    if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
      console.log(`Direct JSON parsing successful: ${parsed.paragraphs.length} paragraphs found`);
      
      // Clean up paragraph content to remove escaped characters and formatting issues
      const cleanedParagraphs = parsed.paragraphs.map((para: any, index: number) => ({
        id: para.id || `para-${index + 1}`,
        content: cleanParagraphContent(para.content || ''),
        wordCount: para.wordCount || (para.content ? para.content.split(/\s+/).length : 0),
        type: para.type || 'body',
        sectionNumber: para.sectionNumber
      })).filter((para: any) => para.content.length > 10); // Filter out very short or empty paragraphs
      
      return {
        output: {
          paragraphs: cleanedParagraphs,
          totalParagraphs: cleanedParagraphs.length,
          documentType: parsed.documentType || 'legal'
        }
      };
    }
    // Check if the parsed object has an output property with paragraphs
    if (parsed.output && parsed.output.paragraphs && Array.isArray(parsed.output.paragraphs)) {
      console.log(`JSON parsing successful with output wrapper: ${parsed.output.paragraphs.length} paragraphs found`);
      
      // Clean up paragraph content
      const cleanedParagraphs = parsed.output.paragraphs.map((para: any, index: number) => ({
        id: para.id || `para-${index + 1}`,
        content: cleanParagraphContent(para.content || ''),
        wordCount: para.wordCount || (para.content ? para.content.split(/\s+/).length : 0),
        type: para.type || 'body',
        sectionNumber: para.sectionNumber
      })).filter((para: any) => para.content.length > 10);
      
      return {
        output: {
          paragraphs: cleanedParagraphs,
          totalParagraphs: cleanedParagraphs.length,
          documentType: parsed.output.documentType || 'legal'
        }
      };
    }
  } catch (error) {
    console.warn('Direct JSON parsing failed for paragraph splitter, attempting extraction');
  }

  // Try to extract JSON from markdown code blocks with enhanced patterns
  try {
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```\s*([\s\S]*?)\s*```/,
      /\{[\s\S]*?"paragraphs"\s*:[\s\S]*?\}/,
      /\{[\s\S]*?\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = responseString.match(pattern);
      if (match) {
        const jsonString = match[1] || match[0];
        try {
          const parsed = JSON.parse(jsonString.trim());
          if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
            console.log(`JSON extraction successful: ${parsed.paragraphs.length} paragraphs found`);
            
            const cleanedParagraphs = parsed.paragraphs.map((para: any, index: number) => ({
              id: para.id || `para-${index + 1}`,
              content: cleanParagraphContent(para.content || ''),
              wordCount: para.wordCount || (para.content ? para.content.split(/\s+/).length : 0),
              type: para.type || 'body',
              sectionNumber: para.sectionNumber
            })).filter((para: any) => para.content.length > 10);
            
            return {
              output: {
                paragraphs: cleanedParagraphs,
                totalParagraphs: cleanedParagraphs.length,
                documentType: parsed.documentType || 'legal'
              }
            };
          }
          if (parsed.output && parsed.output.paragraphs && Array.isArray(parsed.output.paragraphs)) {
            console.log(`JSON extraction successful with wrapper: ${parsed.output.paragraphs.length} paragraphs found`);
            
            const cleanedParagraphs = parsed.output.paragraphs.map((para: any, index: number) => ({
              id: para.id || `para-${index + 1}`,
              content: cleanParagraphContent(para.content || ''),
              wordCount: para.wordCount || (para.content ? para.content.split(/\s+/).length : 0),
              type: para.type || 'body',
              sectionNumber: para.sectionNumber
            })).filter((para: any) => para.content.length > 10);
            
            return parsed;
          }
        } catch (parseError) {
          console.warn(`Failed to parse JSON from pattern ${pattern}:`, parseError);
          continue;
        }
      }
    }
  } catch (error) {
    console.warn('JSON extraction failed for paragraph splitter');
  }
  
  // Enhanced fallback: Try to extract paragraphs from structured text
  console.log('Attempting fallback paragraph extraction from text');
  const paragraphs: any[] = [];
  
  // Look for various paragraph patterns in the text
  const paragraphPatterns = [
    // Numbered paragraphs
    /(\d+\.\s+.*?)(?=\n\d+\.|$)/gs,
    // Paragraph headers
    /Paragraph\s+\d+[:\.]?\s*(.*?)(?=\nParagraph|\n\n|$)/gis,
    // JSON-like paragraph objects in text
    /"content"\s*:\s*"([^"]+)"/g,
    // Long sentences (potential paragraphs)
    /((?:[A-Z][^.!?]*[.!?]\s*){3,})/g
  ];
  
  for (const pattern of paragraphPatterns) {
    const matches = responseString.matchAll(pattern);
    for (const match of matches) {
      const content = match[1]?.trim() || match[0]?.trim();
      if (content && content.length > 100) { // Only include substantial content
        const cleanedContent = cleanParagraphContent(content);
        if (cleanedContent.length > 50) { // Ensure cleaned content is still substantial
          paragraphs.push({
            id: `para-${paragraphs.length + 1}`,
            content: cleanedContent,
            wordCount: cleanedContent.split(/\s+/).length,
            type: 'body'
          });
        }
      }
    }
    
    if (paragraphs.length > 0) {
      console.log(`Fallback extraction successful with pattern: ${paragraphs.length} paragraphs found`);
      break;
    }
  }
  
  // Final fallback: Split by double newlines and filter for substantial content
  if (paragraphs.length === 0) {
    const sections = responseString.split(/\n\s*\n/);
    sections.forEach((section, index) => {
      const cleanedContent = cleanParagraphContent(section.trim());
      // More lenient content filter for final fallback
      if (cleanedContent.length > 50 && !cleanedContent.match(/^(error|failed|unable)/i)) {
        paragraphs.push({
          id: `para-${index + 1}`,
          content: cleanedContent,
          wordCount: cleanedContent.split(/\s+/).length,
          type: 'body'
        });
      }
    });
    console.log(`Final fallback: ${paragraphs.length} paragraphs created from sections`);
  }

  // If still no paragraphs, create a single paragraph from the entire response
  if (paragraphs.length === 0 && responseString.trim().length > 0) {
    console.warn('No paragraphs extracted, creating single paragraph from entire response');
    const cleanedContent = cleanParagraphContent(responseString.trim());
    if (cleanedContent.length > 0) {
      paragraphs.push({
        id: 'para-1',
        content: cleanedContent,
        wordCount: cleanedContent.split(/\s+/).length,
        type: 'body'
      });
    }
  }

  return {
    output: {
      paragraphs: paragraphs,
      totalParagraphs: paragraphs.length,
      documentType: 'legal',
      parsingMethod: 'fallback',
      originalResponseType: typeof response
    }
  };
};

/**
 * Clean paragraph content by removing escaped characters and formatting issues
 */
function cleanParagraphContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  return content
    // Remove excessive escaping
    .replace(/\\\\+/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    // Remove JSON formatting artifacts
    .replace(/^\s*["']|["']\s*$/g, '')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Remove obvious JSON structure indicators
    .replace(/^(Citations|content|id|type|sectionNumber)["\s]*:?\s*/i, '')
    // Remove malformed JSON fragments
    .replace(/^[{}\[\]",\s]+|[{}\[\]",\s]+$/g, '')
    .trim();
}
