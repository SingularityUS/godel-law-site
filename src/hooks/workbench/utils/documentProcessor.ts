
/**
 * Document Processor Utility
 * 
 * Purpose: Handles extraction of text content from legal documents with chunking support
 */

import { DocumentInputNode } from "@/types/workbench";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import { chunkDocument, DocumentChunk } from "./documentChunker";

export const extractDocumentText = async (docNode: DocumentInputNode): Promise<any> => {
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
      // This is a proper File object
      console.log('Using File object arrayBuffer method');
      arrayBuffer = await file.arrayBuffer();
    } else if (file.preview) {
      // This is from Supabase storage, fetch the file content
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
      // Extract text from DOCX files using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      documentType = "docx";
      console.log(`Extracted ${extractedText.length} characters from DOCX file`);
      
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF files, we'll need to handle them differently
      // For now, provide guidance that PDF extraction needs additional setup
      throw new Error('PDF text extraction requires additional setup. Please convert to DOCX or plain text format.');
      
    } else if (fileType?.startsWith('text/') || fileName.endsWith('.txt')) {
      // Handle plain text files - convert ArrayBuffer to text
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
    
    console.log('Successfully extracted text:', extractedText.substring(0, 200) + '...');
    
    // Check if document needs chunking
    const estimatedTokens = Math.ceil(extractedText.length / 4);
    const needsChunking = estimatedTokens > 3000;
    
    let chunks: DocumentChunk[] = [];
    if (needsChunking) {
      console.log(`Document is large (${estimatedTokens} estimated tokens), creating chunks...`);
      chunks = chunkDocument(extractedText, fileName, {
        maxTokens: 3000,
        overlapSize: 200,
        preserveParagraphs: true
      });
    }
    
    return {
      documentType,
      title: fileName,
      content: extractedText.trim(),
      chunks: chunks.length > 0 ? chunks : undefined,
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        contentLength: extractedText.length,
        extractedSuccessfully: true,
        estimatedTokens,
        needsChunking,
        chunkCount: chunks.length
      }
    };
    
  } catch (error) {
    console.error('Error extracting document text:', error);
    
    // Return error information instead of placeholder content
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
