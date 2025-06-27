
/**
 * useMultipleDocumentContext Hook
 * 
 * Purpose: Manages multiple document contexts simultaneously
 * Enables proper document queue functionality with independent processing
 */

import { useCallback, useState, useRef } from "react";

interface DocumentContext {
  name: string;
  file: any;
  anchoredText?: string;
  anchorCount?: number;
  processingStatus: 'idle' | 'processing' | 'completed' | 'error';
  citationAnalysisStatus: 'pending' | 'processing' | 'completed' | 'error';
  lastUpdated: Date;
}

export const useMultipleDocumentContext = () => {
  const [documentContexts, setDocumentContexts] = useState<Map<string, DocumentContext>>(new Map());
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const processingQueue = useRef<string[]>([]);

  /**
   * Add or update a document context
   */
  const addDocumentContext = useCallback((documentName: string, file: any, anchoredText?: string, anchorCount?: number) => {
    setDocumentContexts(prev => {
      const newContexts = new Map(prev);
      const existing = newContexts.get(documentName);
      
      newContexts.set(documentName, {
        name: documentName,
        file,
        anchoredText: anchoredText || existing?.anchoredText,
        anchorCount: anchorCount || existing?.anchorCount,
        processingStatus: anchoredText ? 'completed' : (existing?.processingStatus || 'idle'),
        citationAnalysisStatus: existing?.citationAnalysisStatus || 'pending',
        lastUpdated: new Date()
      });
      
      return newContexts;
    });

    // Set as active if it's the first document or explicitly requested
    if (!activeDocument) {
      setActiveDocument(documentName);
    }

    console.log('📋 [MULTI-DOC] Added/updated document context:', {
      documentName,
      hasAnchoredText: !!anchoredText,
      anchorCount: anchorCount || 0,
      totalDocuments: documentContexts.size + 1
    });
  }, [activeDocument, documentContexts.size]);

  /**
   * Remove a document context
   */
  const removeDocumentContext = useCallback((documentName: string) => {
    setDocumentContexts(prev => {
      const newContexts = new Map(prev);
      newContexts.delete(documentName);
      return newContexts;
    });

    // Update active document if removed document was active
    if (activeDocument === documentName) {
      const remainingDocs = Array.from(documentContexts.keys()).filter(name => name !== documentName);
      setActiveDocument(remainingDocs.length > 0 ? remainingDocs[0] : null);
    }

    // Remove from processing queue
    processingQueue.current = processingQueue.current.filter(name => name !== documentName);
  }, [activeDocument, documentContexts]);

  /**
   * Update document processing status
   */
  const updateDocumentStatus = useCallback((documentName: string, status: Partial<Pick<DocumentContext, 'processingStatus' | 'citationAnalysisStatus'>>) => {
    setDocumentContexts(prev => {
      const newContexts = new Map(prev);
      const existing = newContexts.get(documentName);
      
      if (existing) {
        newContexts.set(documentName, {
          ...existing,
          ...status,
          lastUpdated: new Date()
        });
      }
      
      return newContexts;
    });
  }, []);

  /**
   * Get document context by name
   */
  const getDocumentContext = useCallback((documentName: string): DocumentContext | undefined => {
    return documentContexts.get(documentName);
  }, [documentContexts]);

  /**
   * Get all document contexts
   */
  const getAllDocumentContexts = useCallback((): DocumentContext[] => {
    return Array.from(documentContexts.values());
  }, [documentContexts]);

  /**
   * Get documents ready for citation analysis
   */
  const getDocumentsReadyForAnalysis = useCallback((): DocumentContext[] => {
    return Array.from(documentContexts.values()).filter(doc => 
      doc.processingStatus === 'completed' && 
      doc.citationAnalysisStatus === 'pending' &&
      doc.anchoredText &&
      doc.anchorCount && doc.anchorCount > 0
    );
  }, [documentContexts]);

  /**
   * Add document to processing queue
   */
  const addToProcessingQueue = useCallback((documentName: string) => {
    if (!processingQueue.current.includes(documentName)) {
      processingQueue.current.push(documentName);
    }
  }, []);

  /**
   * Get next document in processing queue
   */
  const getNextInQueue = useCallback((): string | null => {
    return processingQueue.current.length > 0 ? processingQueue.current[0] : null;
  }, []);

  /**
   * Remove document from processing queue
   */
  const removeFromProcessingQueue = useCallback((documentName: string) => {
    processingQueue.current = processingQueue.current.filter(name => name !== documentName);
  }, []);

  return {
    documentContexts: getAllDocumentContexts(),
    activeDocument,
    addDocumentContext,
    removeDocumentContext,
    updateDocumentStatus,
    getDocumentContext,
    getAllDocumentContexts,
    getDocumentsReadyForAnalysis,
    setActiveDocument,
    addToProcessingQueue,
    getNextInQueue,
    removeFromProcessingQueue,
    totalDocuments: documentContexts.size
  };
};
