
/**
 * Paragraph Splitter Response Parser Utility
 * 
 * Purpose: Specialized parsing for paragraph splitter responses with enhanced error handling
 */

export const parseParagraphSplitterResponse = (response: any): any => {
  console.log('=== PARAGRAPH SPLITTER PARSER DEBUG ===');
  console.log('Raw response type:', typeof response);
  console.log('Raw response preview:', typeof response === 'string' ? response.substring(0, 200) + '...' : JSON.stringify(response).substring(0, 200) + '...');
  
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
  
  console.log('Processing response string length:', responseString.length);
  
  // Try direct JSON parsing first
  try {
    const parsed = JSON.parse(responseString);
    console.log('Direct JSON parsing successful, checking structure...');
    
    if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
      console.log(`Found ${parsed.paragraphs.length} paragraphs in direct parse`);
      
      // Validate and clean paragraph content
      const cleanedParagraphs = parsed.paragraphs.map((para: any, index: number) => {
        const cleanContent = cleanParagraphContent(para.content || para.text || '');
        console.log(`Paragraph ${index + 1} original length: ${(para.content || para.text || '').length}, cleaned length: ${cleanContent.length}`);
        
        return {
          id: para.id || `para-${index + 1}`,
          content: cleanContent,
          wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
          type: para.type || 'body',
          sectionNumber: para.sectionNumber || ''
        };
      }).filter(para => para.content.length > 10); // Filter out empty or very short paragraphs
      
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
      console.log(`Found ${parsed.output.paragraphs.length} paragraphs in output wrapper`);
      
      const cleanedParagraphs = parsed.output.paragraphs.map((para: any, index: number) => {
        const cleanContent = cleanParagraphContent(para.content || para.text || '');
        return {
          id: para.id || `para-${index + 1}`,
          content: cleanContent,
          wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
          type: para.type || 'body',
          sectionNumber: para.sectionNumber || ''
        };
      }).filter(para => para.content.length > 10);
      
      return {
        output: {
          paragraphs: cleanedParagraphs,
          totalParagraphs: cleanedParagraphs.length,
          documentType: parsed.output.documentType || 'legal'
        }
      };
    }
  } catch (error) {
    console.warn('Direct JSON parsing failed for paragraph splitter, attempting extraction:', error);
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
            
            const cleanedParagraphs = parsed.paragraphs.map((para: any, index: number) => {
              const cleanContent = cleanParagraphContent(para.content || para.text || '');
              return {
                id: para.id || `para-${index + 1}`,
                content: cleanContent,
                wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
                type: para.type || 'body',
                sectionNumber: para.sectionNumber || ''
              };
            }).filter(para => para.content.length > 10);
            
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
            
            const cleanedParagraphs = parsed.output.paragraphs.map((para: any, index: number) => {
              const cleanContent = cleanParagraphContent(para.content || para.text || '');
              return {
                id: para.id || `para-${index + 1}`,
                content: cleanContent,
                wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
                type: para.type || 'body',
                sectionNumber: para.sectionNumber || ''
              };
            }).filter(para => para.content.length > 10);
            
            return {
              output: {
                paragraphs: cleanedParagraphs,
                totalParagraphs: cleanedParagraphs.length,
                documentType: parsed.output.documentType || 'legal'
              }
            };
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
      if (content && content.length > 100) {
        const cleanContent = cleanParagraphContent(content);
        if (cleanContent.length > 50) {
          paragraphs.push({
            id: `para-${paragraphs.length + 1}`,
            content: cleanContent,
            wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
            type: 'body',
            sectionNumber: ''
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
      const cleanContent = cleanParagraphContent(section.trim());
      if (cleanContent.length > 50 && !cleanContent.match(/^(error|failed|unable)/i)) {
        paragraphs.push({
          id: `para-${index + 1}`,
          content: cleanContent,
          wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
          type: 'body',
          sectionNumber: ''
        });
      }
    });
    console.log(`Final fallback: ${paragraphs.length} paragraphs created from sections`);
  }

  // If still no paragraphs, create a single paragraph from the entire response
  if (paragraphs.length === 0 && responseString.trim().length > 0) {
    console.warn('No paragraphs extracted, creating single paragraph from entire response');
    const cleanContent = cleanParagraphContent(responseString.trim());
    if (cleanContent.length > 0) {
      paragraphs.push({
        id: 'para-1',
        content: cleanContent,
        wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
        type: 'body',
        sectionNumber: ''
      });
    }
  }

  console.log(`=== FINAL RESULT: ${paragraphs.length} paragraphs ===`);
  paragraphs.forEach((para, index) => {
    console.log(`Paragraph ${index + 1}: "${para.content.substring(0, 100)}..." (${para.wordCount} words)`);
  });

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
 * Clean paragraph content by removing JSON artifacts and escaped characters
 */
function cleanParagraphContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Remove escaped quotes and slashes
  let cleaned = content.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  
  // Remove JSON-like artifacts
  cleaned = cleaned.replace(/\{\s*"[^"]*":\s*[^,}]+[,}]/g, '');
  cleaned = cleaned.replace(/^\s*[,}\]]+/, ''); // Remove leading JSON artifacts
  cleaned = cleaned.replace(/[,{\[]+\s*$/, ''); // Remove trailing JSON artifacts
  
  // Remove escaped newlines and normalize whitespace
  cleaned = cleaned.replace(/\\n/g, ' ').replace(/\s+/g, ' ');
  
  // Remove any remaining JSON property patterns
  cleaned = cleaned.replace(/"[^"]*":\s*[^,}]+/g, '');
  cleaned = cleaned.replace(/[{}[\]]/g, '');
  
  // Clean up extra whitespace and punctuation
  cleaned = cleaned.trim().replace(/^[,\s]+|[,\s]+$/g, '');
  
  return cleaned;
}
