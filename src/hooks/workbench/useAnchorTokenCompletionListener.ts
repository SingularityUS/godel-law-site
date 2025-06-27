
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
      hasAnchorTags: anchoredText ? /⟦P-\d{5}⟧/.test(anchoredText) : false,
      documentTextLength: documentText?.length || 0
    });

    // Check if auto-processing is enabled
    if (!autoProcessEnabled) {
      console.log('⏭️ [LISTENER] Auto-processing disabled, skipping citation analysis');
      return;
    }

    // Prevent duplicate processing
    if (isProcessing) {
      console.log('⏭️ [LISTENER] Already processing another document, skipping citation analysis');
      return;
    }

    // For document replacements and new documents, always process regardless of previous processing
    const shouldForceProcess = source === 'drag-drop-replace' || source === 'drag-drop-new';
    
    if (!shouldForceProcess && processedDocuments.current.has(documentName)) {
      console.log('⏭️ [LISTENER] Document already processed and not a forced update, skipping citation analysis');
      return;
    }

    // Validate anchor data with detailed logging
    if (!anchoredText || anchorCount === 0) {
      console.warn('⚠️ [LISTENER] Invalid anchor data:', {
        hasAnchoredText: !!anchoredText,
        anchoredTextLength: anchoredText?.length || 0,
        anchorCount: anchorCount,
        documentName
      });
      console.warn('⚠️ [LISTENER] Skipping auto-analysis due to missing anchor tokens');
      return;
    }

    // Check for valid anchor tag format
    if (!anchoredText || !/⟦P-\d{5}⟧/.test(anchoredText)) {
      console.error('❌ [LISTENER] Invalid anchor text format - missing proper anchor tags');
      console.error('🔍 [LISTENER] Anchor text analysis:', {
        anchoredTextExists: !!anchoredText,
        anchoredTextLength: anchoredText?.length || 0,
        anchorCount: anchorCount,
        firstChars: anchoredText ? anchoredText.substring(0, 200) : 'N/A',
        containsAnchorPattern: anchoredText ? /⟦P-\d{5}⟧/.test(anchoredText) : false,
        regexMatch: anchoredText ? anchoredText.match(/⟦P-\d{5}⟧/g) : null
      });
      return;
    }

    try {
      // Mark as processing to prevent duplicates (but allow force processing for document updates)
      if (shouldForceProcess) {
        console.log('🔄 [LISTENER] Force processing document update:', documentName);
        processedDocuments.current.delete(documentName); // Remove from processed to allow reprocessing
      }
      
      processedDocuments.current.add(documentName);
      
      console.log('🚀 [LISTENER] Starting auto-citation analysis for document:', documentName);
      console.log('📊 [LISTENER] Analysis parameters:', {
        anchoredTextLength: anchoredText.length,
        anchorCount: anchorCount,
        documentTextLength: documentText?.length || 0,
        source: source,
        autoProcessEnabled: autoProcessEnabled,
        isForceProcess: shouldForceProcess
      });
      
      // Log first few anchor tags found
      const anchorMatches = anchoredText.match(/⟦P-\d{5}⟧/g);
      if (anchorMatches) {
        console.log('🔖 [LISTENER] Found anchor tags:', {
          count: anchorMatches.length,
          first5: anchorMatches.slice(0, 5),
          expectedCount: anchorCount
        });
      }
      
      await processCitations(anchoredText, documentName);
      
      console.log('✅ [LISTENER] Auto-citation analysis completed successfully for:', documentName);
      
      // Reset retry counter on success
      retryAttempts.current.delete(documentName);
      
    } catch (error) {
      console.error('💥 [LISTENER] Auto-citation analysis failed:', error);
      console.error('🔍 [LISTENER] Error details:', {
        documentName,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        anchoredTextLength: anchoredText?.length || 0,
        anchorCount: anchorCount
      });
      
      // Implement retry logic
      const currentRetries = retryAttempts.current.get(documentName) || 0;
      if (currentRetries < maxRetries) {
        console.log(`🔄 [LISTENER] Retrying analysis (attempt ${currentRetries + 1}/${maxRetries})`);
        retryAttempts.current.set(documentName, currentRetries + 1);
        
        // Remove from processed set to allow retry
        processedDocuments.current.delete(documentName);
        
        // Retry after a short delay with exponential backoff
        setTimeout(() => {
          console.log(`⏰ [LISTENER] Executing retry ${currentRetries + 1} for: ${documentName}`);
          const retryEvent = new CustomEvent('anchorTokensComplete', { detail: event.detail });
          window.dispatchEvent(retryEvent);
        }, 2000 * (currentRetries + 1));
      } else {
        console.error(`❌ [LISTENER] Max retries exceeded for document: ${documentName}`);
        // Dispatch error event for UI feedback
        const errorEvent = new CustomEvent('citationAnalysisError', {
          detail: {
            documentName,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: 'auto-processing',
            maxRetriesExceeded: true
          }
        });
        console.log('📤 [LISTENER] Dispatching citationAnalysisError event after max retries');
        window.dispatchEvent(errorEvent);
      }
    }
  }, [processCitations, isProcessing, autoProcessEnabled]);

  // Enhanced error handling
  const handleAnchoringError = useCallback((event: CustomEvent) => {
    const { documentName, error, source, debugInfo } = event.detail;
    console.error(`🚨 [LISTENER] Anchoring error detected:`, {
      documentName,
      error,
      source,
      debugInfo
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
      source,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Listen for document changes to clear processed state when appropriate
  const handleDocumentChange = useCallback((event: CustomEvent) => {
    const { documentName } = event.detail;
    console.log('📄 [LISTENER] Document context changed to:', documentName);
    
    // Don't automatically clear processed state - let the citation analysis hook handle caching
    // This allows users to switch between documents and see cached results
  }, []);

  useEffect(() => {
    console.log('🎧 [LISTENER] Setting up anchor token completion listeners');
    console.log('🔧 [LISTENER] Citation analysis state:', {
      autoProcessEnabled,
      isProcessing,
      processedDocumentsCount: processedDocuments.current.size
    });
    
    // Listen for anchor token completion events
    const completionHandler = handleAnchorTokensComplete as EventListener;
    const errorHandler = handleAnchoringError as EventListener;
    const startHandler = handleAnchoringStart as EventListener;
    const documentChangeHandler = handleDocumentChange as EventListener;
    
    window.addEventListener('anchorTokensComplete', completionHandler);
    window.addEventListener('anchoringError', errorHandler);
    window.addEventListener('anchoringStarted', startHandler);
    window.addEventListener('showDocumentInSidebar', documentChangeHandler);

    return () => {
      console.log('🎧 [LISTENER] Cleaning up anchor token completion listeners');
      window.removeEventListener('anchorTokensComplete', completionHandler);
      window.removeEventListener('anchoringError', errorHandler);
      window.removeEventListener('anchoringStarted', startHandler);
      window.removeEventListener('showDocumentInSidebar', documentChangeHandler);
    };
  }, [handleAnchorTokensComplete, handleAnchoringError, handleAnchoringStart, handleDocumentChange, autoProcessEnabled, isProcessing]);

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
