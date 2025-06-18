import { useCallback } from 'react';
import { RedlineDocument } from "@/types/redlining";
import { convertGrammarAnalysisToRedline } from "@/utils/redlining/grammarToRedline";

export const useRedlineDataTransform = () => {
  const transformGrammarData = useCallback((result: any): RedlineDocument | null => {
    try {
      console.log('Transforming grammar data with enhanced document extraction access:', result);
      console.log('Result structure:', {
        hasOutput: !!result?.output,
        hasAnalysis: !!result?.output?.analysis,
        hasFinalOutput: !!result?.finalOutput,
        hasDocumentExtractionResult: !!result?.documentExtractionResult,
        hasMetadataOriginalDocument: !!result?.metadata?.originalDocument,
        analysisLength: result?.output?.analysis?.length || 0,
        hasMetadata: !!result?.metadata,
        resultKeys: Object.keys(result || {})
      });
      
      // Enhanced data extraction with multiple fallback paths
      let analysisData = null;
      let sourceResult = result;
      
      // Path 1: Direct output.analysis
      if (result?.output?.analysis && Array.isArray(result.output.analysis)) {
        analysisData = result.output.analysis;
        sourceResult = result;
        console.log('Using direct output.analysis path');
      }
      
      // Path 2: finalOutput.output.analysis
      else if (result?.finalOutput?.output?.analysis && Array.isArray(result.finalOutput.output.analysis)) {
        analysisData = result.finalOutput.output.analysis;
        sourceResult = result.finalOutput;
        console.log('Using finalOutput.output.analysis path');
      }
      
      // Path 3: nested finalOutput
      else if (result?.finalOutput?.finalOutput?.output?.analysis && Array.isArray(result.finalOutput.finalOutput.output.analysis)) {
        analysisData = result.finalOutput.finalOutput.output.analysis;
        sourceResult = result.finalOutput.finalOutput;
        console.log('Using nested finalOutput path');
      }
      
      // Path 4: Direct analysis property
      else if (result?.analysis && Array.isArray(result.analysis)) {
        analysisData = result.analysis;
        sourceResult = result;
        console.log('Using direct analysis path');
      }

      if (!analysisData || !Array.isArray(analysisData) || analysisData.length === 0) {
        console.warn('No valid analysis data found in any path');
        return null;
      }

      console.log(`Found analysis data with ${analysisData.length} items`);

      // Extract original document metadata with enhanced access to document extraction result
      const originalDocument = extractOriginalDocumentFromPipelineWithExtraction(result);
      console.log('Extracted original document info from pipeline with document extraction:', originalDocument);

      return convertGrammarAnalysisToRedline(sourceResult, originalDocument);
    } catch (error) {
      console.error('Error transforming grammar data:', error);
      return null;
    }
  }, []);

  const validateAnalysisData = useCallback((result: any): boolean => {
    // Check multiple possible paths for analysis data
    const paths = [
      result?.output?.analysis,
      result?.finalOutput?.output?.analysis,
      result?.finalOutput?.finalOutput?.output?.analysis,
      result?.analysis
    ];
    
    for (const path of paths) {
      if (path && Array.isArray(path) && path.length > 0) {
        return true;
      }
    }
    
    return false;
  }, []);

  return {
    transformGrammarData,
    validateAnalysisData
  };
};

/**
 * Enhanced document extraction with direct access to preserved document extraction result
 */
function extractOriginalDocumentFromPipelineWithExtraction(result: any) {
  console.log('Extracting original document from pipeline with document extraction result');
  
  // Priority 1: Direct access to preserved document extraction result
  if (result?.documentExtractionResult) {
    console.log('Found preserved document extraction result:', {
      hasOriginalContent: !!result.documentExtractionResult.originalContent,
      hasProcessableContent: !!result.documentExtractionResult.processableContent,
      fileName: result.documentExtractionResult.fileName,
      contentLength: result.documentExtractionResult.originalContent?.length || 0
    });
    
    return {
      name: result.documentExtractionResult.fileName || 'Document',
      type: result.documentExtractionResult.fileType || 'text/plain',
      content: result.documentExtractionResult.originalContent || '',
      preview: result.documentExtractionResult.originalPreview
    };
  }
  
  // Priority 2: Access via metadata.originalDocument
  if (result?.metadata?.originalDocument) {
    console.log('Found metadata.originalDocument:', {
      hasOriginalContent: !!result.metadata.originalDocument.originalContent,
      fileName: result.metadata.originalDocument.fileName,
      contentLength: result.metadata.originalDocument.originalContent?.length || 0
    });
    
    return {
      name: result.metadata.originalDocument.fileName || 'Document',
      type: result.metadata.originalDocument.fileType || 'text/plain',
      content: result.metadata.originalDocument.originalContent || '',
      preview: result.metadata.originalDocument.originalPreview
    };
  }
  
  // Priority 3: Check pipeline results for document input result
  if (result?.results && Array.isArray(result.results)) {
    const documentResult = result.results.find((r: any) => r.moduleType === 'document-input');
    if (documentResult?.result) {
      console.log('Found document result in pipeline results:', {
        hasOriginalContent: !!documentResult.result.originalContent,
        hasProcessableContent: !!documentResult.result.processableContent,
        fileName: documentResult.result.fileName,
        contentLength: documentResult.result.originalContent?.length || 0
      });
      
      return {
        name: documentResult.result.fileName || 'Document',
        type: documentResult.result.fileType || 'text/plain',
        content: documentResult.result.originalContent || '',
        preview: documentResult.result.originalPreview
      };
    }
  }
  
  // Priority 4: Fallback to existing extraction method
  console.log('Using fallback document extraction method');
  return extractOriginalDocumentInfoWithFormattingFromPipeline(result);
}

/**
 * Enhanced original document info extraction with formatting preservation from pipeline metadata
 */
function extractOriginalDocumentInfoWithFormattingFromPipeline(result: any) {
  console.log('Extracting original document info from pipeline with all metadata paths');
  
  // Try multiple metadata paths from the pipeline
  const metadataPaths = [
    result?.metadata?.originalDocument,
    result?.finalOutput?.metadata?.originalDocument,
    result?.input?.metadata?.originalDocument,
    result?.metadata,
    result?.finalOutput?.metadata,
    result?.input?.metadata
  ];
  
  let originalDocumentInfo = null;
  
  // Find the first valid metadata with document info
  for (const metadata of metadataPaths) {
    if (metadata && (metadata.fileName || metadata.originalContent)) {
      originalDocumentInfo = metadata;
      console.log('Found original document metadata in pipeline:', {
        hasFileName: !!metadata.fileName,
        hasOriginalContent: !!metadata.originalContent,
        contentLength: metadata.originalContent?.length || 0
      });
      break;
    }
  }
  
  // If no metadata found, try direct content extraction
  if (!originalDocumentInfo) {
    console.log('No pipeline metadata found, trying direct content extraction');
    originalDocumentInfo = extractOriginalDocumentInfoWithFormatting(result);
  }
  
  // CRITICAL: Prioritize sources that preserve original formatting
  let originalContent = '';
  
  const contentPaths = [
    // Priority 1: Pipeline metadata original content
    originalDocumentInfo?.originalContent,
    
    // Priority 2: Other metadata sources
    result?.metadata?.originalContent,
    result?.input?.originalContent,
    result?.originalContent,
    
    // Priority 3: Less processed content sources
    result?.input?.content,
    originalDocumentInfo?.content,
    
    // Priority 4: Content from initial processing (might be cleaned)
    result?.content
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.length > 0) {
      originalContent = path; // DO NOT TRIM - preserve exact formatting
      console.log('Selected content source with formatting preservation:', {
        source: 'pipeline content path',
        length: originalContent.length,
        hasLineBreaks: originalContent.includes('\n'),
        hasDoubleLineBreaks: originalContent.includes('\n\n'),
        hasLeadingWhitespace: /^\s/.test(originalContent),
        hasTrailingWhitespace: /\s$/.test(originalContent)
      });
      break;
    }
  }
  
  if (!originalContent) {
    console.error('Could not extract original content from pipeline - this will cause redline display issues');
    originalContent = 'Original document content could not be retrieved from pipeline';
  }

  return {
    name: originalDocumentInfo?.fileName || 
          result?.fileName || 
          'Document',
    type: originalDocumentInfo?.fileType || 
          result?.fileType || 
          'text/plain',
    content: originalContent, // Preserved with all original formatting
    preview: originalDocumentInfo?.originalPreview || 
             result?.originalPreview
  };
}

/**
 * Fallback original document info extraction (legacy support)
 */
function extractOriginalDocumentInfoWithFormatting(result: any) {
  // Try multiple paths for document metadata
  const metadata = result?.metadata || 
                  result?.finalOutput?.metadata || 
                  result?.input?.metadata ||
                  {};

  // CRITICAL: Prioritize sources that preserve original formatting
  let originalContent = '';
  
  const contentPaths = [
    // Priority 1: Original content that should preserve ALL formatting
    metadata?.originalContent,
    result?.metadata?.originalContent,
    result?.input?.originalContent,
    result?.originalContent,
    
    // Priority 2: Less processed content sources
    result?.input?.content,
    metadata?.content,
    
    // Priority 3: Content from initial processing (might be cleaned)
    result?.content
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.length > 0) {
      originalContent = path; // DO NOT TRIM - preserve exact formatting
      console.log('Selected content source with formatting preservation:', {
        source: 'fallback content path',
        length: originalContent.length,
        hasLineBreaks: originalContent.includes('\n'),
        hasDoubleLineBreaks: originalContent.includes('\n\n'),
        hasLeadingWhitespace: /^\s/.test(originalContent),
        hasTrailingWhitespace: /\s$/.test(originalContent)
      });
      break;
    }
  }

  return {
    name: metadata?.fileName || 
          result?.fileName || 
          'Document',
    type: metadata?.fileType || 
          result?.fileType || 
          'text/plain',
    content: originalContent, // Preserved with all original formatting
    preview: metadata?.originalPreview || 
             result?.originalPreview
  };
}
