
/**
 * useDocumentContext Hook
 * 
 * Purpose: Extracts document context from workbench nodes for sidebar display
 */

import { useCallback } from "react";
import { AllNodes } from "@/types/workbench";

export const useDocumentContext = () => {
  const extractDocumentFromNodes = useCallback((nodes: AllNodes[]) => {
    const documentNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    
    if (documentNodes.length === 0) {
      return null;
    }

    // Get the first document node (primary document being processed)
    const primaryDoc = documentNodes[0];
    const docData = primaryDoc.data;

    return {
      name: docData?.documentName || 'Unknown Document',
      type: docData?.file?.type || 'text/plain',
      preview: docData?.file?.preview,
      content: docData?.file?.extractedText || '',
      size: docData?.file?.size,
      nodeId: primaryDoc.id
    };
  }, []);

  return {
    extractDocumentFromNodes
  };
};
