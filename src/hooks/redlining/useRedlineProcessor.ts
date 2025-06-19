
/**
 * useRedlineProcessor Hook
 * 
 * Purpose: Core redline processing system with enhanced error handling and processing guards
 */

import { useState, useEffect, useRef } from "react";
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

  // Processing guards to prevent infinite loops
  const lastProcessedRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !pipelineOutput || isProcessingRef.current) {
      console.log('Redline processing skipped:', {
        enabled,
        hasPipelineOutput: !!pipelineOutput,
        isProcessing: isProcessingRef.current
      });
      return;
    }

    // Create a hash of the pipeline output to detect changes
    const outputHash = JSON.stringify({
      hasResults: !!pipelineOutput.results,
      resultsLength: pipelineOutput.results?.length || 0,
      hasEndpointResults: !!pipelineOutput.endpointResults,
      endpointResultsLength: pipelineOutput.endpointResults?.length || 0,
      summary: pipelineOutput.summary?.processingCompleted || null
    });

    // Skip if we've already processed this exact output
    if (lastProcessedRef.current === outputHash) {
      console.log('Skipping redline processing - already processed this output');
      return;
    }

    const processRedline = async () => {
      if (isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      try {
        console.log('=== REDLINE PROCESSOR START (Enhanced) ===');
        console.log('Pipeline output structure:', {
          hasResults: !!pipelineOutput.results,
          resultsCount: pipelineOutput.results?.length || 0,
          hasEndpointResults: !!pipelineOutput.endpointResults,
          endpointCount: pipelineOutput.endpointResults?.length || 0,
          hasPipelineResults: !!pipelineOutput.pipelineResults,
          pipelineResultsCount: pipelineOutput.pipelineResults?.length || 0,
          hasSummary: !!pipelineOutput.summary,
          outputKeys: Object.keys(pipelineOutput)
        });

        // Step 1: Detect terminal modules with validation
        const terminalModules = detectTerminalModules(pipelineOutput);
        console.log('Terminal modules detected:', terminalModules);

        if (terminalModules.length === 0) {
          throw new Error('No terminal modules found in pipeline output. This may indicate the pipeline has not completed processing or no analysis modules were executed.');
        }

        // Step 2: Collect data from terminal modules with validation
        const terminalData = collectTerminalData(pipelineOutput, terminalModules);
        console.log('Terminal data collected:', {
          moduleCount: terminalData.length,
          hasOriginalContent: terminalData.some(d => d.originalContent && d.originalContent.length > 0),
          totalSuggestions: terminalData.reduce((sum, d) => sum + d.suggestions.length, 0),
          modulesWithContent: terminalData.filter(d => d.originalContent && d.originalContent.length > 0).length
        });

        if (terminalData.length === 0) {
          throw new Error('No valid terminal data collected. Terminal modules may not have produced analyzable results.');
        }

        // Validate that we have some original content
        const hasOriginalContent = terminalData.some(d => d.originalContent && d.originalContent.length > 0);
        if (!hasOriginalContent) {
          throw new Error('No original document content found in terminal modules. The document text may not have been preserved during processing.');
        }

        // Step 3: Create redline document with validation
        const redlineDocument = createRedlineDocument(terminalData);
        
        if (!redlineDocument) {
          throw new Error('Failed to create redline document structure. This may be due to incompatible data formats.');
        }

        if (redlineDocument.suggestions.length === 0) {
          console.warn('Redline document created but contains no suggestions');
        }

        console.log('Redline document created successfully:', {
          id: redlineDocument.id,
          suggestionCount: redlineDocument.suggestions.length,
          originalContentLength: redlineDocument.originalContent.length,
          sourceModules: redlineDocument.metadata.sourceModules
        });

        // Mark this output as processed
        lastProcessedRef.current = outputHash;

        setState(prev => ({
          ...prev,
          document: redlineDocument,
          isProcessing: false,
          terminalModules: terminalModules.map(tm => tm.moduleType)
        }));

      } catch (error: any) {
        console.error('Redline processing failed:', error);
        
        const errorMessage = error.message || 'Unknown error during redline processing';
        
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
          terminalModules: []
        }));
        
        toast({
          title: "Redline Processing Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Add a small delay to prevent rapid re-processing
    const timeoutId = setTimeout(processRedline, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pipelineOutput, enabled]);

  const clearRedline = () => {
    setState({
      document: null,
      isProcessing: false,
      error: null,
      terminalModules: []
    });
    lastProcessedRef.current = '';
  };

  return {
    document: state.document,
    isProcessing: state.isProcessing,
    error: state.error,
    terminalModules: state.terminalModules,
    clearRedline
  };
};
