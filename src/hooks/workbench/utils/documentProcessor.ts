/**
 * Document Processor Utility
 * 
 * Purpose: Handles extraction of text content from legal documents with minimal cleaning for redlining support
 * Now includes anchor token insertion for citation processing
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
  anchoredContent: string; // NEW: Content with anchor tokens
  anchorMap: AnchorMapping[]; // NEW: Mapping of anchors to positions
  positionMap: DocumentPositionMap;
  cleaningResult: CleaningResult;
  chunks?: DocumentChunk[];
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    originalLength: number;
    processableLength: number;
    anchoredLength: number; // NEW: Length with anchors
    anchorCount: number; // NEW: Number of anchors inserted
    extractedSuccessfully: boolean;
    estimatedTokens: number;
    needsChunking: boolean;
    chunkCount: number;
    cleaningApplied: string[];
    error?: string;
  };
}

export interface AnchorMapping {
  anchor: string;
  paragraphIndex: number;
  originalPosition: number;
  anchoredPosition: number;
}

/**
 * Insert anchor tokens before paragraphs for citation processing
 */
function insertAnchorTokens(content: string): { anchoredContent: string; anchorMap: AnchorMapping[] } {
  console.log('Inserting anchor tokens for citation processing...');
  
  // Split content into paragraphs (double line breaks or similar)
  const paragraphs = content.split(/\n\s*\n/);
  const anchorMap: AnchorMapping[] = [];
  let anchoredContent = '';
  let currentPosition = 0;
  
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.trim()) {
      const anchor = `⟦P-${String(index + 1).padStart(5, '0')}⟧`;
      
      // Record mapping
      anchorMap.push({
        anchor,
        paragraphIndex: index,
        originalPosition: currentPosition,
        anchoredPosition: anchoredContent.length
      });
      
      // Add anchor before paragraph
      anchoredContent += anchor + paragraph;
      
      // Add paragraph separator if not the last paragraph
      if (index < paragraphs.length - 1) {
        anchoredContent += '\n\n';
      }
      
      currentPosition += paragraph.length + 2; // +2 for \n\n
    }
  });
  
  console.log(`Inserted ${anchorMap.length} anchor tokens`);
  console.log('Sample anchored content (first 300 chars):', anchoredContent.substring(0, 300));
  
  return { anchoredContent, anchorMap };
}

/**
 * Validates and fixes common character encoding issues in legal documents
 */
const validateAndFixEncoding = (text: string): string => {
  // Common character replacements for legal documents
  const encodingFixes: Array<[RegExp, string]> = [
    // Section symbol
    [//g, '§'],
    // Smart quotes
    [/[""]/g, '"'],
    [/['']/g, "'"],
    // Em dash
    [/—/g, '—'],
    // En dash
    [/–/g, '–'],
  ];
  
  let fixedText = text;
  let appliedFixes = [];
  
  for (const [pattern, replacement] of encodingFixes) {
    const originalLength = fixedText.length;
    fixedText = fixedText.replace(pattern, replacement);
    if (fixedText.length !== originalLength || fixedText !== text) {
      appliedFixes.push(`Fixed ${pattern} -> ${replacement}`);
    }
  }
  
  if (appliedFixes.length > 0) {
    console.log('Applied character encoding fixes:', appliedFixes);
  }
  
  return fixedText;
};

export const extractDocumentText = async (docNode: DocumentInputNode): Promise<DocumentExtractionResult> => {
  console.log('=== DOCUMENT PROCESSOR DEBUG (UTF-8 Character Preservation + Anchor Tokens) ===');
  
  if (!docNode.data?.file) {
    throw new Error('No file attached to document node');
  }

  const file = docNode.data.file;
  const fileName = docNode.data.documentName;
  const fileType = file.type;
  
  console.log(`Extracting text from ${fileName} (${fileType}) with UTF-8 preservation and anchor insertion`);
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
    
    // Handle different file types with proper UTF-8 handling
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      console.log('Extracting DOCX with UTF-8 preservation...');
      
      // Use mammoth with explicit options for better character handling
      const result = await mammoth.extractRawText({ 
        arrayBuffer
      });
      
      extractedText = result.value;
      documentType = "docx";
      
      console.log(`Extracted ${extractedText.length} characters from DOCX file`);
      console.log('First 200 characters (raw):', extractedText.substring(0, 200));
      
      // Apply character encoding fixes for common issues
      const originalText = extractedText;
      extractedText = validateAndFixEncoding(extractedText);
      
      if (extractedText !== originalText) {
        console.log('Character encoding fixes applied');
        console.log('First 200 characters (fixed):', extractedText.substring(0, 200));
      }
      
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      throw new Error('PDF text extraction requires additional setup. Please convert to DOCX or plain text format.');
      
    } else if (fileType?.startsWith('text/') || fileName.endsWith('.txt')) {
      console.log('Extracting text file with UTF-8 decoder...');
      const textDecoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
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
    
    // Log character validation
    const hasSpecialChars = /[§""'']/.test(extractedText);
    const hasReplacementChars = //.test(extractedText);
    
    console.log('Character validation:');
    console.log(`- Contains special legal characters: ${hasSpecialChars}`);
    console.log(`- Contains replacement characters (): ${hasReplacementChars}`);
    
    if (hasReplacementChars) {
      console.warn('WARNING: Document contains replacement characters () - encoding may be corrupted');
    }
    
    // Apply minimal cleaning while preserving original
    console.log('Applying minimal cleaning to preserve document structure...');
    const cleaningResult = performMinimalCleaning(extractedText);
    
    console.log('Cleaning results:');
    console.log(`- Original length: ${cleaningResult.originalContent.length}`);
    console.log(`- Processable length: ${cleaningResult.processableContent.length}`);
    console.log(`- Cleaning applied: ${cleaningResult.cleaningApplied.join(', ')}`);
    console.log(`- First 200 chars (processable): "${cleaningResult.processableContent.substring(0, 200)}..."`);
    
    // NEW: Insert anchor tokens for citation processing
    console.log('Inserting anchor tokens for citation processing...');
    const { anchoredContent, anchorMap } = insertAnchorTokens(cleaningResult.processableContent);
    
    console.log('Anchor token insertion results:');
    console.log(`- Anchored content length: ${anchoredContent.length}`);
    console.log(`- Number of anchors inserted: ${anchorMap.length}`);
    console.log(`- First 300 chars (anchored): "${anchoredContent.substring(0, 300)}..."`);
    
    // Create position mapping for redlining support
    console.log('Creating position mapping for redlining support...');
    const positionMap = createPositionMap(cleaningResult.originalContent, cleaningResult.processableContent);
    console.log(`Position mapping created: ${positionMap.characterMap.length} character mappings, ${positionMap.paragraphBoundaries.length} paragraph boundaries`);
    
    // Check if document needs chunking (based on anchored content for accurate token count)
    const estimatedTokens = Math.ceil(anchoredContent.length / 4);
    const needsChunking = estimatedTokens > 3000;
    
    let chunks: DocumentChunk[] = [];
    if (needsChunking) {
      console.log(`Document is large (${estimatedTokens} estimated tokens), creating chunks from anchored content...`);
      // Use anchored content for chunking since it will be used for AI processing
      chunks = chunkDocument(anchoredContent, fileName, {
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
      anchoredContent, // NEW
      anchorMap, // NEW
      positionMap,
      cleaningResult,
      chunks: chunks.length > 0 ? chunks : undefined,
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        originalLength: cleaningResult.originalContent.length,
        processableLength: cleaningResult.processableContent.length,
        anchoredLength: anchoredContent.length, // NEW
        anchorCount: anchorMap.length, // NEW
        extractedSuccessfully: true,
        estimatedTokens,
        needsChunking,
        chunkCount: chunks.length,
        cleaningApplied: cleaningResult.cleaningApplied
      }
    };
    
    console.log('Document extraction result (UTF-8 preserved + anchored):', {
      originalLength: result.originalContent.length,
      processableLength: result.processableContent.length,
      anchoredLength: result.anchoredContent.length,
      anchorCount: result.anchorMap.length,
      positionMappings: result.positionMap.characterMap.length,
      paragraphBoundaries: result.positionMap.paragraphBoundaries.length,
      chunkCount: result.chunks?.length || 0,
      estimatedTokens: result.metadata.estimatedTokens,
      cleaningApplied: result.metadata.cleaningApplied,
      hasSpecialCharacters: hasSpecialChars,
      hasEncodingIssues: hasReplacementChars
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
      anchoredContent: '', // NEW
      anchorMap: [], // NEW
      positionMap: {
        characterMap: [],
        paragraphBoundaries: [],
        totalOriginalLength: 0,
        totalCleanedLength: 0
      },
      cleaningResult: {
        originalContent: '',
        processableContent: '',
        cleaningApplied: ['error'],
        whitespaceMap: []
      },
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        originalLength: 0,
        processableLength: 0,
        anchoredLength: 0, // NEW
        anchorCount: 0, // NEW
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
