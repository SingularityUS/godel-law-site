/**
 * Context Builder for GPT-4.1 Document Integration
 * 
 * Intelligently formats and structures document content for optimal AI processing
 * Now uses anchored text for citation processing
 */

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string; // NEW: Anchored version for citation processing
  anchorCount?: number; // NEW: Number of anchors
};

export interface DocumentContext {
  content: string;
  metadata: string;
  tokenEstimate: number;
  useAnchoredText: boolean; // NEW: Flag to indicate if anchored text is being used
  anchorCount?: number; // NEW: Number of anchors in content
}

export interface ContextBuildResult {
  fullContext: string;
  documentContexts: DocumentContext[];
  totalTokens: number;
  truncated: boolean;
  excludedDocuments: string[];
  usingAnchoredText: boolean; // NEW: Flag to indicate anchored text usage
  totalAnchors: number; // NEW: Total anchors across all documents
}

/**
 * Build comprehensive context from documents and prompt
 * Now supports anchored text for citation processing
 */
export function buildDocumentContext(
  prompt: string,
  documents: UploadedFile[],
  maxTokens: number = 180000, // Leave room for response
  includeMetadata: boolean = true,
  useAnchoredText: boolean = true // NEW: Option to use anchored text
): ContextBuildResult {
  const documentContexts: DocumentContext[] = [];
  let totalTokens = Math.ceil(prompt.length / 4);
  let truncated = false;
  const excludedDocuments: string[] = [];
  let totalAnchors = 0; // NEW

  console.log(`Building document context with anchored text: ${useAnchoredText}`);

  // Process each document
  for (const doc of documents) {
    // Choose which text version to use
    const textToUse = useAnchoredText && doc.anchoredText ? doc.anchoredText : doc.extractedText;
    
    if (!textToUse) {
      excludedDocuments.push(`${doc.name} (no text content)`);
      continue;
    }

    const anchorCount = doc.anchorCount || 0;
    if (useAnchoredText && anchorCount > 0) {
      totalAnchors += anchorCount;
      console.log(`Using anchored text for ${doc.name}: ${anchorCount} anchors, ${textToUse.length} chars`);
    }

    const metadata = includeMetadata ? formatDocumentMetadata(doc, anchorCount) : '';
    const content = formatDocumentContent(doc.name, textToUse, doc.type, useAnchoredText && anchorCount > 0);
    
    const contextTokens = Math.ceil((metadata + content).length / 4);
    
    // Check if adding this document would exceed limits
    if (totalTokens + contextTokens > maxTokens) {
      // Try to include a truncated version
      const availableTokens = maxTokens - totalTokens - Math.ceil(metadata.length / 4);
      
      if (availableTokens > 500) { // Minimum useful content
        const truncatedContent = truncateDocumentContent(
          doc.name,
          textToUse,
          doc.type,
          availableTokens * 4, // Convert back to characters
          useAnchoredText && anchorCount > 0
        );
        
        documentContexts.push({
          content: truncatedContent,
          metadata,
          tokenEstimate: Math.ceil((metadata + truncatedContent).length / 4),
          useAnchoredText: useAnchoredText && anchorCount > 0,
          anchorCount: anchorCount
        });
        
        totalTokens += Math.ceil((metadata + truncatedContent).length / 4);
        truncated = true;
        break; // Can't fit any more documents
      } else {
        excludedDocuments.push(`${doc.name} (insufficient space)`);
        break;
      }
    } else {
      documentContexts.push({
        content,
        metadata,
        tokenEstimate: contextTokens,
        useAnchoredText: useAnchoredText && anchorCount > 0,
        anchorCount: anchorCount
      });
      totalTokens += contextTokens;
    }
  }

  // Build the full context
  const fullContext = buildFullContext(prompt, documentContexts, useAnchoredText);

  console.log(`Context built: ${documentContexts.length} documents, ${totalTokens} tokens, ${totalAnchors} total anchors`);

  return {
    fullContext,
    documentContexts,
    totalTokens,
    truncated,
    excludedDocuments,
    usingAnchoredText: useAnchoredText && totalAnchors > 0, // NEW
    totalAnchors // NEW
  };
}

/**
 * Format document metadata for context
 * Now includes anchor information
 */
function formatDocumentMetadata(doc: UploadedFile, anchorCount: number): string {
  const metadata = [
    `Document: ${doc.name}`,
    `Type: ${doc.type}`,
    `Size: ${formatFileSize(doc.size)}`,
  ];

  if (anchorCount > 0) {
    metadata.push(`Anchor Tokens: ${anchorCount} (⟦P-#####⟧ format)`);
  }

  if (doc.lastModified) {
    metadata.push(`Modified: ${new Date(doc.lastModified).toLocaleDateString()}`);
  }

  return `--- DOCUMENT METADATA ---\n${metadata.join('\n')}\n\n`;
}

/**
 * Format document content with clear boundaries
 * Now indicates if anchor tokens are present
 */
function formatDocumentContent(name: string, content: string, type: string, hasAnchors: boolean = false): string {
  const anchorNote = hasAnchors ? ' (WITH ANCHOR TOKENS)' : '';
  const boundary = `=== DOCUMENT: ${name}${anchorNote} ===`;
  const footer = `=== END OF ${name} ===`;
  
  // Clean up the content
  const cleanContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .trim();

  return `${boundary}\n\n${cleanContent}\n\n${footer}\n\n`;
}

/**
 * Truncate document content intelligently
 * Now preserves anchor tokens when possible
 */
function truncateDocumentContent(
  name: string,
  content: string,
  type: string,
  maxLength: number,
  hasAnchors: boolean = false
): string {
  const anchorNote = hasAnchors ? ' (WITH ANCHOR TOKENS - TRUNCATED)' : ' (TRUNCATED)';
  const boundary = `=== DOCUMENT: ${name}${anchorNote} ===`;
  const footer = `=== END OF ${name} ===`;
  const truncationNotice = '\n\n[... CONTENT TRUNCATED FOR LENGTH ...]\n\n';
  
  const overhead = boundary.length + footer.length + truncationNotice.length + 10;
  const availableLength = maxLength - overhead;
  
  if (availableLength < 100) {
    return `${boundary}\n\n[DOCUMENT TOO LARGE TO INCLUDE]\n\n${footer}\n\n`;
  }

  // Try to truncate at anchor boundaries if present, then sentence boundaries
  let truncatedContent = content.substring(0, availableLength);
  
  if (hasAnchors) {
    // Try to truncate at an anchor boundary
    const lastAnchor = truncatedContent.lastIndexOf('⟦P-');
    if (lastAnchor > availableLength * 0.7) {
      truncatedContent = content.substring(0, lastAnchor);
    }
  } else {
    // Original logic for non-anchored content
    const lastSentence = truncatedContent.lastIndexOf('.');
    const lastParagraph = truncatedContent.lastIndexOf('\n\n');
    
    // Prefer paragraph breaks, then sentence breaks
    if (lastParagraph > availableLength * 0.7) {
      truncatedContent = content.substring(0, lastParagraph);
    } else if (lastSentence > availableLength * 0.7) {
      truncatedContent = content.substring(0, lastSentence + 1);
    }
  }

  return `${boundary}\n\n${truncatedContent}${truncationNotice}${footer}\n\n`;
}

/**
 * Build the complete context for GPT-4.1
 * Now includes information about anchor tokens
 */
function buildFullContext(prompt: string, documentContexts: DocumentContext[], useAnchoredText: boolean): string {
  if (documentContexts.length === 0) {
    return prompt;
  }

  const documentSection = documentContexts
    .map(ctx => ctx.metadata + ctx.content)
    .join('');

  const totalAnchors = documentContexts.reduce((sum, ctx) => sum + (ctx.anchorCount || 0), 0);
  const anchorInfo = useAnchoredText && totalAnchors > 0 
    ? ` The documents contain ${totalAnchors} anchor tokens in the format ⟦P-#####⟧ which mark paragraph positions for citation processing.`
    : '';

  const contextHeader = `I have uploaded ${documentContexts.length} document(s) for your analysis.${anchorInfo} Please review the documents below and then respond to my question.\n\n`;

  const contextFooter = `\n\nBased on the documents above, please respond to the following:\n\n${prompt}`;

  return contextHeader + documentSection + contextFooter;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Optimize context for specific use cases
 */
export function optimizeContextForUseCase(
  documents: UploadedFile[],
  useCase: 'summary' | 'analysis' | 'comparison' | 'extraction' | 'citation-processing'
): UploadedFile[] {
  // For citation processing, ensure anchored text is available
  if (useCase === 'citation-processing') {
    return documents.filter(doc => doc.anchoredText && doc.anchorCount && doc.anchorCount > 0);
  }
  
  // For now, return documents as-is for other use cases
  return documents;
}
