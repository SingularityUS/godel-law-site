
/**
 * useDocumentContext Hook
 * 
 * Purpose: Extracts document context from workbench nodes for sidebar display
 * Enhanced to preserve paragraph anchor tags for citation analysis
 */

import { useCallback } from "react";
import { AllNodes } from "@/types/workbench";

export const useDocumentContext = () => {
  const extractDocumentFromNodes = useCallback((nodes: AllNodes[]) => {
    console.log('📄 useDocumentContext: extractDocumentFromNodes called with', nodes?.length, 'nodes');
    
    const documentNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    console.log('📄 useDocumentContext: Found', documentNodes.length, 'document nodes');
    
    if (documentNodes.length === 0) {
      console.log('📄 useDocumentContext: No document nodes found');
      return null;
    }

    // Get the first document node (primary document being processed)
    const primaryDoc = documentNodes[0];
    const docData = primaryDoc.data;
    
    console.log('📄 useDocumentContext: Primary document data:', {
      documentName: docData?.documentName,
      fileType: docData?.file?.type,
      hasFile: !!docData?.file,
      hasPreview: !!docData?.file?.preview,
      hasExtractedText: !!docData?.file?.extractedText,
      hasAnchoredText: !!docData?.file?.anchoredText,
      hasExtractedData: !!docData?.extractedData,
      anchorCount: docData?.file?.anchorCount || 0
    });

    // Prefer anchored text for citation analysis (preserves paragraph markers)
    let documentContent = '';
    let hasAnchorTags = false;
    
    // First try to get anchored text from the file object
    if (docData?.file?.anchoredText) {
      documentContent = docData.file.anchoredText;
      hasAnchorTags = true;
      console.log('📄 useDocumentContext: Using anchored text from file object');
    }
    // Then try from extracted data in the node with proper type checking
    else if (docData?.extractedData && typeof docData.extractedData === 'object' && docData.extractedData !== null) {
      const extractedData = docData.extractedData as Record<string, any>;
      if (extractedData.anchoredContent && typeof extractedData.anchoredContent === 'string') {
        documentContent = extractedData.anchoredContent;
        hasAnchorTags = true;
        console.log('📄 useDocumentContext: Using anchored content from extracted data');
      }
    }
    // Fallback to regular extracted text
    if (!documentContent && docData?.file?.extractedText) {
      documentContent = docData.file.extractedText;
      console.log('📄 useDocumentContext: Using extracted text (no anchors)');
    }
    // Last resort - preview text
    if (!documentContent && docData?.file?.preview) {
      documentContent = docData.file.preview;
      console.log('📄 useDocumentContext: Using preview text (no anchors)');
    }

    // Double-check for anchor tags in the content
    if (documentContent) {
      const anchorMatches = documentContent.match(/⟦P-\d{5}⟧/g);
      if (anchorMatches) {
        hasAnchorTags = true;
        console.log('📄 useDocumentContext: Detected', anchorMatches.length, 'anchor tags in content');
      }
    }

    const extractedDocument = {
      name: docData?.documentName || 'Unknown Document',
      type: docData?.file?.type || 'text/plain',
      preview: docData?.file?.preview,
      content: documentContent,
      size: docData?.file?.size,
      nodeId: primaryDoc.id,
      hasAnchorTags,
      anchorCount: documentContent.match(/⟦P-\d{5}⟧/g)?.length || 0
    };
    
    console.log('📄 useDocumentContext: Extracted document:', {
      ...extractedDocument,
      contentLength: extractedDocument.content.length,
      contentPreview: extractedDocument.content.substring(0, 200),
      hasAnchorTags: extractedDocument.hasAnchorTags,
      anchorCount: extractedDocument.anchorCount
    });
    
    return extractedDocument;
  }, []);

  return {
    extractDocumentFromNodes
  };
};
