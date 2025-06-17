
/**
 * Document Processor Utility
 * 
 * Purpose: Handles extraction of text content from legal documents with enhanced debugging
 */

import { DocumentInputNode } from "@/types/workbench";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import { chunkDocument, DocumentChunk } from "./documentChunker";

export const extractDocumentText = async (docNode: DocumentInputNode): Promise<any> => {
  console.log('=== DOCUMENT PROCESSOR DEBUG ===');
  
  if (!docNode.data?.file) {
    throw new Error('No file attached to document node');
  }

  const file = docNode.data.file;
  const fileName = docNode.data.documentName;
  const fileType = file.type;
  
  console.log(`Extracting text from ${fileName} (${fileType})`);
  console.log('File object:', file);
  
  try {
    let extractedText = '';
    let documentType = "unknown";
    let arrayBuffer: ArrayBuffer;
    
    // Check if this is a proper File object or a Supabase storage reference
    if (typeof file.arrayBuffer === 'function') {
      console.log('Using File object arrayBuffer method');
      arrayBuffer = await file.arrayBuffer();
    } else if (file.preview) {
      console.log('Fetching file from Supabase storage:', file.preview);
      const response = await fetch(file.preview);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from storage: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } else {
      throw new Error('Unable to access file content - no arrayBuffer method or preview URL');
    }
    
    // Handle different file types
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      documentType = "docx";
      console.log(`Extracted ${extractedText.length} characters from DOCX file`);
      
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      throw new Error('PDF text extraction requires additional setup. Please convert to DOCX or plain text format.');
      
    } else if (fileType?.startsWith('text/') || fileName.endsWith('.txt')) {
      const textDecoder = new TextDecoder('utf-8');
      extractedText = textDecoder.decode(arrayBuffer);
      documentType = "text";
      console.log(`Extracted ${extractedText.length} characters from text file`);
      
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Supported formats: .docx, .txt`);
    }
    
    // Validate that we actually extracted content
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }
    
    // Clean the extracted text
    const cleanedText = cleanExtractedText(extractedText);
    console.log('Text cleaning stats:');
    console.log(`- Original length: ${extractedText.length}`);
    console.log(`- Cleaned length: ${cleanedText.length}`);
    console.log(`- First 200 chars: "${cleanedText.substring(0, 200)}..."`);
    
    // Check if document needs chunking
    const estimatedTokens = Math.ceil(cleanedText.length / 4);
    const needsChunking = estimatedTokens > 3000;
    
    let chunks: DocumentChunk[] = [];
    if (needsChunking) {
      console.log(`Document is large (${estimatedTokens} estimated tokens), creating chunks...`);
      chunks = chunkDocument(cleanedText, fileName, {
        maxTokens: 3000,
        overlapSize: 200,
        preserveParagraphs: true
      });
    }
    
    const result = {
      documentType,
      title: fileName,
      content: cleanedText,
      chunks: chunks.length > 0 ? chunks : undefined,
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        contentLength: cleanedText.length,
        extractedSuccessfully: true,
        estimatedTokens,
        needsChunking,
        chunkCount: chunks.length
      }
    };
    
    console.log('Document extraction result:', {
      contentLength: result.content.length,
      chunkCount: result.chunks?.length || 0,
      estimatedTokens: result.metadata.estimatedTokens
    });
    
    return result;
    
  } catch (error) {
    console.error('Error extracting document text:', error);
    
    return {
      documentType: "error",
      title: fileName,
      content: `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        extractedSuccessfully: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

/**
 * Clean extracted text to ensure it's properly formatted
 */
function cleanExtractedText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Normalize line endings
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove excessive whitespace but preserve paragraph structure
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
  cleaned = cleaned.replace(/\n\s+/g, '\n'); // Remove leading spaces on new lines
  cleaned = cleaned.replace(/\s+\n/g, '\n'); // Remove trailing spaces before new lines
  
  // Normalize paragraph breaks (convert multiple newlines to double newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}
