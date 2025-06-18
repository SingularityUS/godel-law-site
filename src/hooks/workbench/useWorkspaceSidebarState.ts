
/**
 * useWorkspaceSidebarState Hook
 * 
 * Purpose: Manages state specific to the workspace sidebar
 * Extracted from WorkspaceSidebar for better organization
 */

import { useState, useCallback, useMemo, useEffect } from "react";

export const useWorkspaceSidebarState = (output: any) => {
  const [activeTab, setActiveTab] = useState("document");
  const [isGeneratingRedline, setIsGeneratingRedline] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ name: string; type: string; preview?: string } | null>(null);

  /**
   * Enhanced pipeline type detection with multiple fallback checks
   */
  const isLegalPipeline = useMemo(() => {
    console.log('Checking pipeline type for output:', output);
    
    // Check multiple possible locations for pipeline type
    const pipelineType = output?.summary?.pipelineType || 
                        output?.metadata?.pipelineType ||
                        output?.pipelineType;
    
    const hasAnalysisData = output?.output?.analysis || 
                           output?.finalOutput?.output?.analysis ||
                           output?.analysis;
    
    console.log('Pipeline type detected:', pipelineType);
    console.log('Has analysis data:', !!hasAnalysisData);
    
    return pipelineType === "Legal Document Analysis" || !!hasAnalysisData;
  }, [output]);

  /**
   * Toggle generating state
   */
  const toggleGeneratingRedline = useCallback((generating: boolean) => {
    setIsGeneratingRedline(generating);
  }, []);

  /**
   * Set document for preview and switch to document tab
   */
  const setDocumentPreview = useCallback((document: { name: string; type: string; preview?: string } | null) => {
    setPreviewDocument(document);
    if (document) {
      setActiveTab("document");
    }
  }, []);

  // Listen for document preview events
  useEffect(() => {
    const handleDocumentPreview = (event: CustomEvent) => {
      console.log('Document preview event received:', event.detail);
      setDocumentPreview(event.detail);
    };

    window.addEventListener('showDocumentInSidebar', handleDocumentPreview as EventListener);
    
    return () => {
      window.removeEventListener('showDocumentInSidebar', handleDocumentPreview as EventListener);
    };
  }, [setDocumentPreview]);

  return {
    activeTab,
    setActiveTab,
    isGeneratingRedline,
    toggleGeneratingRedline,
    previewDocument,
    setDocumentPreview,
    isLegalPipeline
  };
};
