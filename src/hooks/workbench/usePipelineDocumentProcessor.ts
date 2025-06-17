
/**
 * usePipelineDocumentProcessor Hook
 * 
 * Purpose: Handles document processing within pipeline execution
 */

import { useCallback } from "react";
import { AllNodes, DocumentInputNode } from "@/types/workbench";
import { extractDocumentText } from "./utils/documentProcessor";

export const usePipelineDocumentProcessor = () => {
  const processDocumentNode = useCallback(async (node: DocumentInputNode) => {
    // Extract text from legal document
    const currentData = await extractDocumentText(node);
    
    // Show chunking info if document was chunked
    if (currentData.chunks && currentData.chunks.length > 1) {
      console.log(`Document chunked into ${currentData.chunks.length} parts for processing`);
    }
    
    // Log document statistics
    const stats = currentData.metadata;
    console.log(`Document stats: ${stats?.contentLength || 0} chars, ${stats?.estimatedTokens || 0} tokens, ${stats?.chunkCount || 1} chunks`);
    
    return currentData;
  }, []);

  return {
    processDocumentNode
  };
};
