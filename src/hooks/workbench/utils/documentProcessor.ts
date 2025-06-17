
/**
 * Document Processor Utility
 * 
 * Purpose: Handles extraction of text content from legal documents
 */

import { DocumentInputNode } from "@/types/workbench";

export const extractDocumentText = async (docNode: DocumentInputNode): Promise<any> => {
  if (!docNode.data?.file) {
    throw new Error('No file attached to document node');
  }

  const file = docNode.data.file;
  
  // For text files, read directly
  if (file.type?.startsWith('text/')) {
    const textContent = await file.text();
    return {
      documentType: "unknown",
      title: docNode.data.documentName,
      content: textContent,
      metadata: {
        fileName: docNode.data.documentName,
        fileType: file.type,
        fileSize: file.size
      }
    };
  }
  
  // For other file types, create structured data for legal processing
  return {
    documentType: "unknown",
    title: docNode.data.documentName,
    content: `Legal Document Analysis Required\n\nDocument: ${docNode.data.documentName}\nFile type: ${file.type}\nSize: ${file.size} bytes\n\nThis document requires text extraction and legal analysis.`,
    metadata: {
      fileName: docNode.data.documentName,
      fileType: file.type,
      fileSize: file.size,
      requiresOCR: !file.type?.startsWith('text/')
    }
  };
};
