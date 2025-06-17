
/**
 * Paragraph Splitter Response Parser Utility
 * 
 * Purpose: Specialized parsing for paragraph splitter responses
 */

export const parseParagraphSplitterResponse = (response: string): any => {
  console.log('Parsing paragraph splitter response, length:', response.length);
  
  // Try direct JSON parsing first
  try {
    const parsed = JSON.parse(response);
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
  } catch (error) {
    console.warn('Direct JSON parsing failed for paragraph splitter, attempting extraction');
  }

  // Try to extract JSON from markdown code blocks
  try {
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```\s*([\s\S]*?)\s*```/,
      /\{[\s\S]*"paragraphs"[\s\S]*\}/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = response.match(pattern);
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
        } catch (parseError) {
          console.warn(`Failed to parse JSON from pattern ${pattern}:`, parseError);
          continue;
        }
      }
    }
  } catch (error) {
    console.warn('JSON extraction failed for paragraph splitter');
  }
  
  // Fallback: Try to extract paragraphs from structured text
  console.log('Attempting fallback paragraph extraction from text');
  const paragraphs: any[] = [];
  
  // Look for numbered paragraphs or sections
  const paragraphPatterns = [
    /(\d+\.\s+.*?)(?=\n\d+\.|$)/gs,
    /Paragraph\s+\d+[:\.]?\s*(.*?)(?=\nParagraph|\n\n|$)/gis,
    /((?:[A-Z][^.!?]*[.!?]\s*){2,})/g
  ];
  
  for (const pattern of paragraphPatterns) {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      const content = match[1]?.trim();
      if (content && content.length > 50) {
        paragraphs.push({
          id: `para-${paragraphs.length + 1}`,
          content: content,
          wordCount: content.split(/\s+/).length
        });
      }
    }
    
    if (paragraphs.length > 0) {
      console.log(`Fallback extraction successful: ${paragraphs.length} paragraphs found`);
      break;
    }
  }
  
  // If still no paragraphs found, split by double newlines
  if (paragraphs.length === 0) {
    const sections = response.split(/\n\s*\n/);
    sections.forEach((section, index) => {
      const content = section.trim();
      if (content.length > 50) {
        paragraphs.push({
          id: `para-${index + 1}`,
          content: content,
          wordCount: content.split(/\s+/).length
        });
      }
    });
    console.log(`Final fallback: ${paragraphs.length} paragraphs created from sections`);
  }

  return {
    output: {
      paragraphs: paragraphs,
      totalParagraphs: paragraphs.length,
      documentType: 'legal',
      parsingMethod: 'fallback'
    }
  };
};
