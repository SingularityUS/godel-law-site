
/**
 * useRedlineProcessor Hook
 * 
 * Purpose: Core redline processing system that converts pipeline terminal module outputs
 * into a unified redline document for user review and editing.
 */

import { useState, useEffect } from "react";
import { RedlineDocument } from "@/types/redlining";
import { detectTerminalModules } from "./utils/terminalModuleDetector";
import { collectTerminalData } from "./utils/terminalDataCollector";
import { createRedlineDocument } from "./utils/redlineDocumentBuilder";
import { toast } from "@/hooks/use-toast";

interface UseRedlineProcessorProps {
  pipelineOutput: any;
  enabled?: boolean;
}

interface RedlineProcessorState {
  document: RedlineDocument | null;
  isProcessing: boolean;
  error: string | null;
  terminalModules: string[];
}

export const useRedlineProcessor = ({ 
  pipelineOutput, 
  enabled = true 
}: UseRedlineProcessorProps) => {
  const [state, setState] = useState<RedlineProcessorState>({
    document: null,
    isProcessing: false,
    error: null,
    terminalModules: []
  });

  useEffect(() => {
    if (!enabled || !pipelineOutput) {
      console.log('Redline processing disabled or no pipeline output');
      return;
    }

    const processRedline = async () => {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      try {
        console.log('=== REDLINE PROCESSOR START ===');
        console.log('Pipeline output structure:', {
          hasEndpointResults: !!pipelineOutput.endpointResults,
          endpointCount: pipelineOutput.endpointResults?.length || 0,
          hasSummary: !!pipelineOutput.summary,
          outputKeys: Object.keys(pipelineOutput)
        });

        // Step 1: Detect terminal modules
        const terminalModules = detectTerminalModules(pipelineOutput);
        console.log('Terminal modules detected:', terminalModules);

        if (terminalModules.length === 0) {
          console.warn('No terminal modules found in pipeline');
          setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: 'No terminal modules found in pipeline output',
            terminalModules: []
          }));
          return;
        }

        // Step 2: Collect data from terminal modules
        const terminalData = collectTerminalData(pipelineOutput, terminalModules);
        console.log('Terminal data collected:', {
          moduleCount: terminalData.length,
          hasOriginalContent: terminalData.some(d => d.originalContent),
          totalSuggestions: terminalData.reduce((sum, d) => sum + d.suggestions.length, 0)
        });

        // Step 3: Create redline document
        const redlineDocument = createRedlineDocument(terminalData);
        
        if (!redlineDocument) {
          throw new Error('Failed to create redline document from terminal data');
        }

        console.log('Redline document created successfully:', {
          id: redlineDocument.id,
          suggestionCount: redlineDocument.suggestions.length,
          originalContentLength: redlineDocument.originalContent.length
        });

        setState(prev => ({
          ...prev,
          document: redlineDocument,
          isProcessing: false,
          terminalModules
        }));

      } catch (error: any) {
        console.error('Redline processing failed:', error);
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error.message || 'Unknown error during redline processing',
          terminalModules: []
        }));
        
        toast({
          title: "Redline Processing Error",
          description: error.message || "Failed to process pipeline output for redlining",
          variant: "destructive"
        });
      }
    };

    processRedline();
  }, [pipelineOutput, enabled]);

  const clearRedline = () => {
    setState({
      document: null,
      isProcessing: false,
      error: null,
      terminalModules: []
    });
  };

  return {
    document: state.document,
    isProcessing: state.isProcessing,
    error: state.error,
    terminalModules: state.terminalModules,
    clearRedline
  };
};
