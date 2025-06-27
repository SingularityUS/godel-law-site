
/**
 * useAnchoringStatus Hook
 * 
 * Purpose: Tracks real-time anchoring process status for documents
 * Provides visual feedback states: idle, processing, complete, error
 */

import { useState, useEffect, useCallback } from "react";

export type AnchoringStatus = 'idle' | 'processing' | 'complete' | 'error';

interface AnchoringStatusState {
  status: AnchoringStatus;
  progress?: number;
  message?: string;
  timestamp: number;
}

interface AnchoringStartEvent {
  documentName: string;
  source: 'upload' | 'drag-drop' | 'manual';
}

interface AnchoringProgressEvent {
  documentName: string;
  progress: number;
  step: string;
}

interface AnchoringCompleteEvent {
  documentName: string;
  anchorCount: number;
  source: 'upload' | 'drag-drop' | 'manual';
}

interface AnchoringErrorEvent {
  documentName: string;
  error: string;
  source: 'upload' | 'drag-drop' | 'manual';
}

export const useAnchoringStatus = () => {
  const [documentStatuses, setDocumentStatuses] = useState<Map<string, AnchoringStatusState>>(new Map());

  const updateDocumentStatus = useCallback((documentName: string, status: AnchoringStatus, progress?: number, message?: string) => {
    setDocumentStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(documentName, {
        status,
        progress,
        message,
        timestamp: Date.now()
      });
      return newMap;
    });
  }, []);

  const getDocumentStatus = useCallback((documentName: string): AnchoringStatusState => {
    return documentStatuses.get(documentName) || {
      status: 'idle',
      timestamp: Date.now()
    };
  }, [documentStatuses]);

  const clearDocumentStatus = useCallback((documentName: string) => {
    setDocumentStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(documentName);
      return newMap;
    });
  }, []);

  // New function to initialize document status based on existing data
  const initializeDocumentStatus = useCallback((documentName: string, file: any) => {
    // Check if document already has anchored content
    if (file.anchoredText && file.anchorCount > 0) {
      console.log('🔄 Initializing document with existing anchored content:', documentName);
      updateDocumentStatus(documentName, 'complete', 100, `Completed with ${file.anchorCount} anchors`);
    } else if (file.extractedText && !file.anchoredText) {
      console.log('⚠️ Initializing document with extracted text but no anchors:', documentName);
      updateDocumentStatus(documentName, 'error', 0, 'No anchor tokens found');
    }
    // If no extracted text, leave as idle (won't show indicator)
  }, [updateDocumentStatus]);

  // Listen for anchoring start events
  useEffect(() => {
    const handleAnchoringStart = (event: CustomEvent<AnchoringStartEvent>) => {
      const { documentName } = event.detail;
      console.log('🔄 Anchoring started for:', documentName);
      updateDocumentStatus(documentName, 'processing', 0, 'Starting anchoring process...');
    };

    window.addEventListener('anchoringStarted', handleAnchoringStart as EventListener);
    return () => window.removeEventListener('anchoringStarted', handleAnchoringStart as EventListener);
  }, [updateDocumentStatus]);

  // Listen for anchoring progress events
  useEffect(() => {
    const handleAnchoringProgress = (event: CustomEvent<AnchoringProgressEvent>) => {
      const { documentName, progress, step } = event.detail;
      console.log('📊 Anchoring progress for:', documentName, `${progress}%`, step);
      updateDocumentStatus(documentName, 'processing', progress, step);
    };

    window.addEventListener('anchoringProgress', handleAnchoringProgress as EventListener);
    return () => window.removeEventListener('anchoringProgress', handleAnchoringProgress as EventListener);
  }, [updateDocumentStatus]);

  // Listen for anchoring completion events
  useEffect(() => {
    const handleAnchoringComplete = (event: CustomEvent<AnchoringCompleteEvent>) => {
      const { documentName, anchorCount } = event.detail;
      console.log('✅ Anchoring completed for:', documentName, 'with', anchorCount, 'anchors');
      updateDocumentStatus(documentName, 'complete', 100, `Completed with ${anchorCount} anchors`);
    };

    window.addEventListener('anchorTokensComplete', handleAnchoringComplete as EventListener);
    return () => window.removeEventListener('anchorTokensComplete', handleAnchoringComplete as EventListener);
  }, [updateDocumentStatus]);

  // Listen for anchoring error events
  useEffect(() => {
    const handleAnchoringError = (event: CustomEvent<AnchoringErrorEvent>) => {
      const { documentName, error } = event.detail;
      console.error('❌ Anchoring error for:', documentName, error);
      updateDocumentStatus(documentName, 'error', 0, `Error: ${error}`);
    };

    window.addEventListener('anchoringError', handleAnchoringError as EventListener);
    return () => window.removeEventListener('anchoringError', handleAnchoringError as EventListener);
  }, [updateDocumentStatus]);

  return {
    getDocumentStatus,
    updateDocumentStatus,
    clearDocumentStatus,
    initializeDocumentStatus,
    documentStatuses: Array.from(documentStatuses.entries())
  };
};
