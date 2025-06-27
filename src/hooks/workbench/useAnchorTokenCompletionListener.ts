
/**
 * useAnchorTokenCompletionListener Hook
 * 
 * Purpose: Listens for anchor token completion events and automatically triggers citation analysis
 * This creates a clean separation between anchor token generation and citation analysis
 */

import { useEffect, useCallback, useRef } from "react";
import { useCitationAnalysis } from "./useCitationAnalysis";

export interface AnchorTokenCompletionEvent {
  documentName: string;
  documentText: string;
  anchoredText: string;
  anchorCount: number;
  source: 'upload' | 'drag-drop' | 'manual';
}

export const useAnchorTokenCompletionListener = () => {
  const { processCitations, isProcessing } = useCitationAnalysis();
  const processedDocuments = useRef<Set<string>>(new Set());

  const handleAnchorTokensComplete = useCallback(async (event: CustomEvent<AnchorTokenCompletionEvent>) => {
    const { documentName, anchoredText, anchorCount, source } = event.detail;
    
    console.log('🎯 Anchor tokens completion detected:', {
      documentName,
      anchorCount,
      source,
      isProcessing,
      alreadyProcessed: processedDocuments.current.has(documentName)
    });

    // Prevent duplicate processing
    if (isProcessing || processedDocuments.current.has(documentName)) {
      console.log('⏭️ Skipping auto-processing: already processing or processed');
      return;
    }

    // Check if document has anchor tokens
    if (!anchoredText || anchorCount === 0) {
      console.log('⚠️ No anchor tokens found, skipping auto-analysis');
      return;
    }

    try {
      // Mark as processing to prevent duplicates
      processedDocuments.current.add(documentName);
      
      console.log('🚀 Auto-triggering citation analysis for document:', documentName);
      await processCitations(anchoredText, documentName);
      
      console.log('✅ Auto-citation analysis completed for:', documentName);
    } catch (error) {
      console.error('💥 Auto-citation analysis failed:', error);
      // Remove from processed set on error so user can retry
      processedDocuments.current.delete(documentName);
    }
  }, [processCitations, isProcessing]);

  useEffect(() => {
    // Listen for anchor token completion events
    const eventHandler = handleAnchorTokensComplete as EventListener;
    window.addEventListener('anchorTokensComplete', eventHandler);

    return () => {
      window.removeEventListener('anchorTokensComplete', eventHandler);
    };
  }, [handleAnchorTokensComplete]);

  const clearProcessedDocuments = useCallback(() => {
    processedDocuments.current.clear();
  }, []);

  return {
    clearProcessedDocuments
  };
};
