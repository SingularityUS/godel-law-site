
/**
 * Deterministic Paragraph Splitter
 * 
 * Purpose: Simple, reliable paragraph splitting without AI processing
 * Eliminates JSON corruption and maintains exact character positions
 */

export interface ParagraphSplit {
  id: string;
  content: string;
  originalStart: number;
  originalEnd: number;
  wordCount: number;
  type: 'heading' | 'body' | 'numbered';
  sectionNumber?: string;
}

export interface ParagraphSplitResult {
  paragraphs: ParagraphSplit[];
  totalParagraphs: number;
  documentType: 'legal';
  splitMethod: 'deterministic';
  originalLength: number;
}

/**
 * Split document into paragraphs using simple rules
 */
export const splitDocumentIntoParagraphs = (content: string): ParagraphSplitResult => {
  console.log('=== DETERMINISTIC PARAGRAPH SPLITTER ===');
  console.log('Input content length:', content.length);
  
  if (!content || content.trim().length === 0) {
    return {
      paragraphs: [],
      totalParagraphs: 0,
      documentType: 'legal',
      splitMethod: 'deterministic',
      originalLength: 0
    };
  }
  
  const paragraphs: ParagraphSplit[] = [];
  
  // Split on double newlines (paragraph breaks)
  const rawParagraphs = content.split(/\n\s*\n/);
  let currentPosition = 0;
  
  rawParagraphs.forEach((rawParagraph, index) => {
    const trimmed = rawParagraph.trim();
    
    // Skip empty paragraphs
    if (trimmed.length < 10) {
      // Update position tracking even for skipped content
      currentPosition = content.indexOf(rawParagraph, currentPosition) + rawParagraph.length;
      return;
    }
    
    // Find exact start position in original content
    const startPos = content.indexOf(rawParagraph, currentPosition);
    const endPos = startPos + rawParagraph.length;
    
    // Determine paragraph type
    let type: 'heading' | 'body' | 'numbered' = 'body';
    let sectionNumber = '';
    
    // Check for numbered sections (e.g., "1.", "A.", "I.")
    const numberedMatch = trimmed.match(/^(\d+\.|\w\.|[IVX]+\.)/);
    if (numberedMatch) {
      type = 'numbered';
      sectionNumber = numberedMatch[1];
    }
    
    // Check for headings (ALL CAPS or title case patterns)
    if (trimmed.length < 100 && (
      trimmed === trimmed.toUpperCase() || 
      /^[A-Z][A-Z\s]+$/.test(trimmed)
    )) {
      type = 'heading';
    }
    
    const wordCount = trimmed.split(/\s+/).filter(word => word.length > 0).length;
    
    paragraphs.push({
      id: `para-${paragraphs.length + 1}`,
      content: trimmed,
      originalStart: startPos,
      originalEnd: endPos,
      wordCount,
      type,
      sectionNumber
    });
    
    // Update position for next search
    currentPosition = endPos;
  });
  
  console.log(`Split into ${paragraphs.length} paragraphs using deterministic method`);
  paragraphs.forEach((para, idx) => {
    console.log(`Paragraph ${idx + 1}: "${para.content.substring(0, 50)}..." (${para.wordCount} words, pos: ${para.originalStart}-${para.originalEnd})`);
  });
  
  return {
    paragraphs,
    totalParagraphs: paragraphs.length,
    documentType: 'legal',
    splitMethod: 'deterministic',
    originalLength: content.length
  };
};
