
/**
 * useAnchorTokenCompletionListener Hook
 * 
 * Purpose: Listens for anchor token completion events and automatically triggers citation analysis
 * This creates a clean separation between anchor token generation and citation analysis
 * Enhanced with comprehensive debugging and retry mechanisms
 */

import { useEffect, useCallback, useRef } from "react";
import { useCitationAnalysis } from "./useCitationAnalysis";

export interface AnchorTokenCompletionEvent {
  documentName: string;
  documentText: string;
  anchoredText: string;
  anchorCount: number;
  source: 'upload' | 'drag-drop' | 'drag-drop-replace' | 'drag-drop-new' | 'manual';
}

export const useAnchorTokenCompletionListener = () => {
  const { processCitations, isProcessing, autoProcessEnabled } = useCitationAnalysis();
  const processedDocuments = useRef<Set<string>>(new Set());
  const retryAttempts = useRef<Map<string, number>>(new Map());
  const maxRetries = 3;

  const handleAnchorTokensComplete = useCallback(async (event: CustomEvent<AnchorTokenCompletionEvent>) => {
    const { documentName, anchoredText, anchorCount, source, documentText } = event.detail;
    
    console.log('🎯 [LISTENER] Anchor tokens completion detected:', {
      documentName,
      anchorCount,
      source,
      isProcessing,
      autoProcessEnabled,
      alreadyProcessed: processedDocuments.current.has(documentName),
      anchoredTextLength: anchoredText?.length || 0,
      hasAnchorTags: anchoredText ? /⟦P-\d{5}⟧/.test(anchoredText) : false
    });

    // Check if auto-processing is enabled
    if (!autoProcessEnabled) {
      console.log('⏭️ [LISTENER] Auto-processing disabled, skipping');
      return;
    }

    // Prevent duplicate processing
    if (isProcessing) {
      console.log('⏭️ [LISTENER] Already processing another document, skipping');
      return;
    }

    if (processedDocuments.current.has(documentName)) {
      console.log('⏭️ [LISTENER] Document already processed, skipping');
      return;
    }

    // Validate anchor data
    if (!anchoredText || anchorCount === 0) {
      console.warn('⚠️ [LISTENER] No anchor tokens found, skipping auto-analysis');
      return;
    }

    // Check for valid anchor tag format
    if (!anchoredText || !/⟦P-\d{5}⟧/.test(anchoredText)) {
      console.error('❌ [LISTENER] Invalid anchor text format - missing proper anchor tags');
      console.error('Anchor text preview:', anchoredText?.substring(0, 500));
      return;
    }

    try {
      // Mark as processing to prevent duplicates
      processedDocuments.current.add(documentName);
      
      console.log('🚀 [LISTENER] Starting auto-citation analysis for document:', documentName);
      console.log('📊 [LISTENER] Analysis parameters:', {
        anchoredTextLength: anchoredText.length,
        anchorCount: anchorCount,
        documentTextLength: documentText?.length || 0
      });
      
      await processCitations(anchoredText, documentName);
      
      console.log('✅ [LISTENER] Auto-citation analysis completed successfully for:', documentName);
      
      // Reset retry counter on success
      retryAttempts.current.delete(documentName);
      
    } catch (error) {
      console.error('💥 [LISTENER] Auto-citation analysis failed:', error);
      
      // Implement retry logic
      const currentRetries = retryAttempts.current.get(documentName) || 0;
      if (currentRetries < maxRetries) {
        console.log(`🔄 [LISTENER] Retrying analysis (attempt ${currentRetries + 1}/${maxRetries})`);
        retryAttempts.current.set(documentName, currentRetries + 1);
        
        // Remove from processed set to allow retry
        processedDocuments.current.delete(documentName);
        
        // Retry after a short delay
        setTimeout(() => {
          const retryEvent = new CustomEvent('anchorTokensComplete', { detail: event.detail });
          window.dispatchEvent(retryEvent);
        }, 2000 * (currentRetries + 1)); // Exponential backoff
      } else {
        console.error(`❌ [LISTENER] Max retries exceeded for document: ${documentName}`);
        // Dispatch error event for UI feedback
        const errorEvent = new CustomEvent('citationAnalysisError', {
          detail: {
            documentName,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: 'auto-processing'
          }
        });
        window.dispatchEvent(errorEvent);
      }
    }
  }, [processCitations, isProcessing, autoProcessEnabled]);

  // Enhanced error handling
  const handleAnchoringError = useCallback((event: CustomEvent) => {
    const { documentName, error, source } = event.detail;
    console.error(`🚨 [LISTENER] Anchoring error detected:`, {
      documentName,
      error,
      source
    });
    
    // Remove from processed documents to allow manual retry
    processedDocuments.current.delete(documentName);
    retryAttempts.current.delete(documentName);
  }, []);

  // Enhanced start event handling for better tracking
  const handleAnchoringStart = useCallback((event: CustomEvent) => {
    const { documentName, source } = event.detail;
    console.log(`🎬 [LISTENER] Anchoring started:`, {
      documentName,
      source
    });
  }, []);

  useEffect(() => {
    console.log('🎧 [LISTENER] Setting up anchor token completion listeners');
    
    // Listen for anchor token completion events
    const completionHandler = handleAnchorTokensComplete as EventListener;
    const errorHandler = handleAnchoringError as EventListener;
    const startHandler = handleAnchoringStart as EventListener;
    
    window.addEventListener('anchorTokensComplete', completionHandler);
    window.addEventListener('anchoringError', errorHandler);
    window.addEventListener('anchoringStarted', startHandler);

    return () => {
      console.log('🎧 [LISTENER] Cleaning up anchor token completion listeners');
      window.removeEventListener('anchorTokensComplete', completionHandler);
      window.removeEventListener('anchoringError', errorHandler);
      window.removeEventListener('anchoringStarted', startHandler);
    };
  }, [handleAnchorTokensComplete, handleAnchoringError, handleAnchoringStart]);

  const clearProcessedDocuments = useCallback(() => {
    console.log('🧹 [LISTENER] Clearing processed documents cache');
    processedDocuments.current.clear();
    retryAttempts.current.clear();
  }, []);

  const getProcessingStatus = useCallback(() => {
    return {
      processedCount: processedDocuments.current.size,
      processedDocuments: Array.from(processedDocuments.current),
      retryAttempts: Object.fromEntries(retryAttempts.current)
    };
  }, []);

  return {
    clearProcessedDocuments,
    getProcessingStatus
  };
};
