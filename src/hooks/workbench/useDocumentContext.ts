
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
      hasAnchoredText: !!docData?.file?.anchoredText
    });

    // Prefer anchored text for citation analysis (preserves paragraph markers)
    const documentContent = docData?.file?.anchoredText || 
                           docData?.file?.extractedText || 
                           docData?.file?.preview || 
                           '';

    const extractedDocument = {
      name: docData?.documentName || 'Unknown Document',
      type: docData?.file?.type || 'text/plain',
      preview: docData?.file?.preview,
      content: documentContent,
      size: docData?.file?.size,
      nodeId: primaryDoc.id,
      hasAnchorTags: !!docData?.file?.anchoredText
    };
    
    console.log('📄 useDocumentContext: Extracted document:', {
      ...extractedDocument,
      contentLength: extractedDocument.content.length,
      contentPreview: extractedDocument.content.substring(0, 200)
    });
    
    return extractedDocument;
  }, []);

  return {
    extractDocumentFromNodes
  };
};
