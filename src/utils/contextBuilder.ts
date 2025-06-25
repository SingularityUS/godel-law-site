
/**
 * Context Builder for GPT-4.1 Document Integration
 * 
 * Intelligently formats and structures document content for optimal AI processing
 */

export type UploadedFile = File & { preview?: string; extractedText?: string };

export interface DocumentContext {
  content: string;
  metadata: string;
  tokenEstimate: number;
}

export interface ContextBuildResult {
  fullContext: string;
  documentContexts: DocumentContext[];
  totalTokens: number;
  truncated: boolean;
  excludedDocuments: string[];
}

/**
 * Build comprehensive context from documents and prompt
 */
export function buildDocumentContext(
  prompt: string,
  documents: UploadedFile[],
  maxTokens: number = 180000, // Leave room for response
  includeMetadata: boolean = true
): ContextBuildResult {
  const documentContexts: DocumentContext[] = [];
  let totalTokens = Math.ceil(prompt.length / 4);
  let truncated = false;
  const excludedDocuments: string[] = [];

  // Process each document
  for (const doc of documents) {
    if (!doc.extractedText) {
      excludedDocuments.push(`${doc.name} (no text content)`);
      continue;
    }

    const metadata = includeMetadata ? formatDocumentMetadata(doc) : '';
    const content = formatDocumentContent(doc.name, doc.extractedText, doc.type);
    
    const contextTokens = Math.ceil((metadata + content).length / 4);
    
    // Check if adding this document would exceed limits
    if (totalTokens + contextTokens > maxTokens) {
      // Try to include a truncated version
      const availableTokens = maxTokens - totalTokens - Math.ceil(metadata.length / 4);
      
      if (availableTokens > 500) { // Minimum useful content
        const truncatedContent = truncateDocumentContent(
          doc.name,
          doc.extractedText,
          doc.type,
          availableTokens * 4 // Convert back to characters
        );
        
        documentContexts.push({
          content: truncatedContent,
          metadata,
          tokenEstimate: Math.ceil((metadata + truncatedContent).length / 4)
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
        tokenEstimate: contextTokens
      });
      totalTokens += contextTokens;
    }
  }

  // Build the full context
  const fullContext = buildFullContext(prompt, documentContexts);

  return {
    fullContext,
    documentContexts,
    totalTokens,
    truncated,
    excludedDocuments
  };
}

/**
 * Format document metadata for context
 */
function formatDocumentMetadata(doc: UploadedFile): string {
  const metadata = [
    `Document: ${doc.name}`,
    `Type: ${doc.type}`,
    `Size: ${formatFileSize(doc.size)}`,
  ];

  if (doc.lastModified) {
    metadata.push(`Modified: ${new Date(doc.lastModified).toLocaleDateString()}`);
  }

  return `--- DOCUMENT METADATA ---\n${metadata.join('\n')}\n\n`;
}

/**
 * Format document content with clear boundaries
 */
function formatDocumentContent(name: string, content: string, type: string): string {
  const boundary = `=== DOCUMENT: ${name} ===`;
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
 */
function truncateDocumentContent(
  name: string,
  content: string,
  type: string,
  maxLength: number
): string {
  const boundary = `=== DOCUMENT: ${name} (TRUNCATED) ===`;
  const footer = `=== END OF ${name} ===`;
  const truncationNotice = '\n\n[... CONTENT TRUNCATED FOR LENGTH ...]\n\n';
  
  const overhead = boundary.length + footer.length + truncationNotice.length + 10;
  const availableLength = maxLength - overhead;
  
  if (availableLength < 100) {
    return `${boundary}\n\n[DOCUMENT TOO LARGE TO INCLUDE]\n\n${footer}\n\n`;
  }

  // Try to truncate at sentence boundaries
  let truncatedContent = content.substring(0, availableLength);
  const lastSentence = truncatedContent.lastIndexOf('.');
  const lastParagraph = truncatedContent.lastIndexOf('\n\n');
  
  // Prefer paragraph breaks, then sentence breaks
  if (lastParagraph > availableLength * 0.7) {
    truncatedContent = content.substring(0, lastParagraph);
  } else if (lastSentence > availableLength * 0.7) {
    truncatedContent = content.substring(0, lastSentence + 1);
  }

  return `${boundary}\n\n${truncatedContent}${truncationNotice}${footer}\n\n`;
}

/**
 * Build the complete context for GPT-4.1
 */
function buildFullContext(prompt: string, documentContexts: DocumentContext[]): string {
  if (documentContexts.length === 0) {
    return prompt;
  }

  const documentSection = documentContexts
    .map(ctx => ctx.metadata + ctx.content)
    .join('');

  const contextHeader = `I have uploaded ${documentContexts.length} document(s) for your analysis. Please review the documents below and then respond to my question.\n\n`;

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
  useCase: 'summary' | 'analysis' | 'comparison' | 'extraction'
): UploadedFile[] {
  // For now, return documents as-is
  // Future: implement use-case specific optimizations
  return documents;
}
