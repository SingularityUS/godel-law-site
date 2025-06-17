
/**
 * Document Processor Utility
 * 
 * Purpose: Handles extraction of text content from legal documents with minimal cleaning for redlining support
 */

import { DocumentInputNode } from "@/types/workbench";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import { chunkDocument, DocumentChunk } from "./documentChunker";
import { performMinimalCleaning, CleaningResult } from "./minimalTextCleaner";
import { createPositionMap, DocumentPositionMap } from "./positionTracker";

export interface DocumentExtractionResult {
  documentType: string;
  title: string;
  originalContent: string;
  processableContent: string;
  positionMap: DocumentPositionMap;
  cleaningResult: CleaningResult;
  chunks?: DocumentChunk[];
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    originalLength: number;
    processableLength: number;
    extractedSuccessfully: boolean;
    estimatedTokens: number;
    needsChunking: boolean;
    chunkCount: number;
    cleaningApplied: string[];
    error?: string;
  };
}

export const extractDocumentText = async (docNode: DocumentInputNode): Promise<DocumentExtractionResult> => {
  console.log('=== DOCUMENT PROCESSOR DEBUG (Minimal Cleaning) ===');
  
  if (!docNode.data?.file) {
    throw new Error('No file attached to document node');
  }

  const file = docNode.data.file;
  const fileName = docNode.data.documentName;
  const fileType = file.type;
  
  console.log(`Extracting text from ${fileName} (${fileType}) with minimal cleaning`);
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
    
    // Apply minimal cleaning while preserving original
    console.log('Applying minimal cleaning to preserve document structure...');
    const cleaningResult = performMinimalCleaning(extractedText);
    
    console.log('Cleaning results:');
    console.log(`- Original length: ${cleaningResult.originalContent.length}`);
    console.log(`- Processable length: ${cleaningResult.processableContent.length}`);
    console.log(`- Cleaning applied: ${cleaningResult.cleaningApplied.join(', ')}`);
    console.log(`- First 200 chars (processable): "${cleaningResult.processableContent.substring(0, 200)}..."`);
    
    // Create position mapping for redlining support
    console.log('Creating position mapping for redlining support...');
    const positionMap = createPositionMap(cleaningResult.originalContent, cleaningResult.processableContent);
    console.log(`Position mapping created: ${positionMap.characterMap.length} character mappings, ${positionMap.paragraphBoundaries.length} paragraph boundaries`);
    
    // Check if document needs chunking (based on processable content)
    const estimatedTokens = Math.ceil(cleaningResult.processableContent.length / 4);
    const needsChunking = estimatedTokens > 3000;
    
    let chunks: DocumentChunk[] = [];
    if (needsChunking) {
      console.log(`Document is large (${estimatedTokens} estimated tokens), creating chunks from processable content...`);
      // Use processable content for chunking since it will be used for AI processing
      chunks = chunkDocument(cleaningResult.processableContent, fileName, {
        maxTokens: 3000,
        overlapSize: 200,
        preserveParagraphs: true
      });
    }
    
    const result: DocumentExtractionResult = {
      documentType,
      title: fileName,
      originalContent: cleaningResult.originalContent,
      processableContent: cleaningResult.processableContent,
      positionMap,
      cleaningResult,
      chunks: chunks.length > 0 ? chunks : undefined,
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        originalLength: cleaningResult.originalContent.length,
        processableLength: cleaningResult.processableContent.length,
        extractedSuccessfully: true,
        estimatedTokens,
        needsChunking,
        chunkCount: chunks.length,
        cleaningApplied: cleaningResult.cleaningApplied
      }
    };
    
    console.log('Document extraction result (minimal cleaning):', {
      originalLength: result.originalContent.length,
      processableLength: result.processableContent.length,
      positionMappings: result.positionMap.characterMap.length,
      paragraphBoundaries: result.positionMap.paragraphBoundaries.length,
      chunkCount: result.chunks?.length || 0,
      estimatedTokens: result.metadata.estimatedTokens,
      cleaningApplied: result.metadata.cleaningApplied
    });
    
    return result;
    
  } catch (error) {
    console.error('Error extracting document text:', error);
    
    // Return error structure that matches the new interface
    const errorResult: DocumentExtractionResult = {
      documentType: "error",
      title: fileName,
      originalContent: '',
      processableContent: `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      positionMap: {
        characterMap: [],
        paragraphBoundaries: [],
        totalOriginalLength: 0,
        totalCleanedLength: 0
      },
      cleaningResult: {
        originalContent: '',
        processableContent: '',
        cleaningApplied: ['error']
      },
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        originalLength: 0,
        processableLength: 0,
        extractedSuccessfully: false,
        estimatedTokens: 0,
        needsChunking: false,
        chunkCount: 0,
        cleaningApplied: ['error'],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
    
    return errorResult;
  }
};
