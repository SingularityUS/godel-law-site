
/**
 * Paragraph Splitter Response Parser Utility
 * 
 * Purpose: Specialized parsing for paragraph splitter responses with enhanced error handling
 */

export const parseParagraphSplitterResponse = (response: any): any => {
  console.log('Parsing paragraph splitter response, type:', typeof response, 'length:', typeof response === 'string' ? response.length : 'N/A');
  
  // Handle non-string responses
  let responseString: string;
  if (typeof response === 'string') {
    responseString = response;
  } else if (response && typeof response === 'object') {
    // If response is already parsed, check if it has paragraphs
    if (response.paragraphs && Array.isArray(response.paragraphs)) {
      console.log(`Response already parsed: ${response.paragraphs.length} paragraphs found`);
      return {
        output: {
          paragraphs: response.paragraphs,
          totalParagraphs: response.paragraphs.length,
          documentType: response.documentType || 'legal'
        }
      };
    }
    responseString = JSON.stringify(response);
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
      return {
        output: {
          paragraphs: parsed.paragraphs,
          totalParagraphs: parsed.paragraphs.length,
          documentType: parsed.documentType || 'legal'
        }
      };
    }
    // Check if the parsed object has an output property with paragraphs
    if (parsed.output && parsed.output.paragraphs && Array.isArray(parsed.output.paragraphs)) {
      console.log(`JSON parsing successful with output wrapper: ${parsed.output.paragraphs.length} paragraphs found`);
      return parsed;
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
            return {
              output: {
                paragraphs: parsed.paragraphs,
                totalParagraphs: parsed.paragraphs.length,
                documentType: parsed.documentType || 'legal'
              }
            };
          }
          if (parsed.output && parsed.output.paragraphs && Array.isArray(parsed.output.paragraphs)) {
            console.log(`JSON extraction successful with wrapper: ${parsed.output.paragraphs.length} paragraphs found`);
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
        paragraphs.push({
          id: `para-${paragraphs.length + 1}`,
          content: content,
          wordCount: content.split(/\s+/).length
        });
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
      const content = section.trim();
      // More lenient content filter for final fallback
      if (content.length > 50 && !content.match(/^(error|failed|unable)/i)) {
        paragraphs.push({
          id: `para-${index + 1}`,
          content: content,
          wordCount: content.split(/\s+/).length
        });
      }
    });
    console.log(`Final fallback: ${paragraphs.length} paragraphs created from sections`);
  }

  // If still no paragraphs, create a single paragraph from the entire response
  if (paragraphs.length === 0 && responseString.trim().length > 0) {
    console.warn('No paragraphs extracted, creating single paragraph from entire response');
    paragraphs.push({
      id: 'para-1',
      content: responseString.trim(),
      wordCount: responseString.trim().split(/\s+/).length
    });
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
