
/**
 * useWorkspaceSidebarState Hook
 * 
 * Purpose: Manages state specific to the workspace sidebar
 * Extracted from WorkspaceSidebar for better organization
 */

import { useState, useCallback, useMemo } from "react";

export const useWorkspaceSidebarState = (output: any) => {
  const [activeTab, setActiveTab] = useState("redline");
  const [isGeneratingRedline, setIsGeneratingRedline] = useState(false);

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

  return {
    activeTab,
    setActiveTab,
    isGeneratingRedline,
    toggleGeneratingRedline,
    isLegalPipeline
  };
};
