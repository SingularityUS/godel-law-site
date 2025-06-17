
/**
 * Document Processor Utility
 * 
 * Purpose: Handles extraction of text content from legal documents
 */

import { DocumentInputNode } from "@/types/workbench";
import mammoth from "mammoth";

export const extractDocumentText = async (docNode: DocumentInputNode): Promise<any> => {
  if (!docNode.data?.file) {
    throw new Error('No file attached to document node');
  }

  const file = docNode.data.file;
  const fileName = docNode.data.documentName;
  const fileType = file.type;
  
  console.log(`Extracting text from ${fileName} (${fileType})`);
  
  try {
    let extractedText = '';
    let documentType = "unknown";
    
    // Handle different file types
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      // Extract text from DOCX files using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      documentType = "docx";
      console.log(`Extracted ${extractedText.length} characters from DOCX file`);
      
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF files, we'll need to handle them differently
      // For now, provide guidance that PDF extraction needs additional setup
      throw new Error('PDF text extraction requires additional setup. Please convert to DOCX or plain text format.');
      
    } else if (fileType?.startsWith('text/') || fileName.endsWith('.txt')) {
      // Handle plain text files
      extractedText = await file.text();
      documentType = "text";
      console.log(`Extracted ${extractedText.length} characters from text file`);
      
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Supported formats: .docx, .txt`);
    }
    
    // Validate that we actually extracted content
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }
    
    return {
      documentType,
      title: fileName,
      content: extractedText.trim(),
      metadata: {
        fileName,
        fileType,
        fileSize: file.size,
        contentLength: extractedText.length,
        extractedSuccessfully: true
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
