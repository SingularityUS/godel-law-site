
/**
 * useDocumentContext Hook
 * 
 * Purpose: Extracts document context from workbench nodes for sidebar display
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
      hasExtractedText: !!docData?.file?.extractedText
    });

    const extractedDocument = {
      name: docData?.documentName || 'Unknown Document',
      type: docData?.file?.type || 'text/plain',
      preview: docData?.file?.preview,
      content: docData?.file?.extractedText || '',
      size: docData?.file?.size,
      nodeId: primaryDoc.id
    };
    
    console.log('📄 useDocumentContext: Extracted document:', extractedDocument);
    return extractedDocument;
  }, []);

  return {
    extractDocumentFromNodes
  };
};
