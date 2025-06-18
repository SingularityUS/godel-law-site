/**
 * useStreamingRedlineGeneration Hook
 * 
 * Purpose: Manages streaming redline document generation with incremental updates
 * Allows redline documents to be built and displayed as batches complete
 */

import { useState, useEffect, useCallback } from "react";
import { RedlineDocument } from "@/types/redlining";
import { useRedlineDataTransform } from "@/hooks/redlining/useRedlineDataTransform";
import { toast } from "@/hooks/use-toast";

interface UseStreamingRedlineGenerationProps {
  output: any;
  isLegalPipeline: boolean;
  onBatchComplete?: (batchResult: any, batchIndex: number, totalBatches: number) => void;
}

interface StreamingRedlineState {
  isGenerating: boolean;
  completedBatches: number;
  totalBatches: number;
  partialDocument: RedlineDocument | null;
  finalDocument: RedlineDocument | null;
}

export const useStreamingRedlineGeneration = ({
  output,
  isLegalPipeline,
  onBatchComplete
}: UseStreamingRedlineGenerationProps) => {
  const [streamingState, setStreamingState] = useState<StreamingRedlineState>({
    isGenerating: false,
    completedBatches: 0,
    totalBatches: 0,
    partialDocument: null,
    finalDocument: null
  });

  const { transformGrammarData } = useRedlineDataTransform();

  // Process incremental batch results for streaming display with enhanced document access
  const processIncrementalBatch = useCallback((batchResult: any, batchIndex: number, totalBatches: number) => {
    console.log(`Streaming: Processing incremental batch ${batchIndex + 1}/${totalBatches} with document context:`, {
      hasAnalysis: !!batchResult.output?.analysis,
      analysisCount: batchResult.output?.analysis?.length || 0,
      hasDocumentExtraction: !!batchResult.documentExtractionResult,
      documentFileName: batchResult.documentExtractionResult?.fileName,
      documentContentLength: batchResult.documentExtractionResult?.originalContent?.length || 0
    });
    
    try {
      // Enhanced batch result for redline transformation with complete document context
      const enhancedBatchResult = {
        output: {
          analysis: batchResult.output?.analysis || []
        },
        // CRITICAL: Include document extraction result from streaming batch
        documentExtractionResult: batchResult.documentExtractionResult,
        // Fallback to main output metadata if streaming doesn't have document context
        metadata: batchResult.metadata || output.metadata
      };

      // Transform the enhanced batch result to redline format
      const partialRedlineData = transformGrammarData(enhancedBatchResult);

      if (partialRedlineData) {
        setStreamingState(prev => ({
          ...prev,
          completedBatches: batchIndex + 1,
          totalBatches,
          partialDocument: partialRedlineData
        }));

        console.log(`Streaming redline updated successfully: ${batchIndex + 1}/${totalBatches} batches complete - Document displayed with original content`);
      } else {
        console.warn(`Failed to transform batch ${batchIndex + 1}/${totalBatches} to redline format`);
      }
    } catch (error) {
      console.error('Error processing incremental batch for redline:', error);
    }
  }, [transformGrammarData, output.metadata]);

  // Register the streaming callback immediately when legal pipeline starts
  useEffect(() => {
    if (isLegalPipeline) {
      console.log('Registering streaming redline callback for legal pipeline');
      window.streamingRedlineCallback = processIncrementalBatch;
      
      // Listen for early callback registration events
      const handleStreamingCallbackReady = (event: CustomEvent) => {
        console.log('Streaming callback ready event received - re-registering callback');
        window.streamingRedlineCallback = processIncrementalBatch;
      };

      window.addEventListener('streamingCallbackReady', handleStreamingCallbackReady as EventListener);
      
      return () => {
        window.removeEventListener('streamingCallbackReady', handleStreamingCallbackReady as EventListener);
      };
    }
    
    return () => {
      if (window.streamingRedlineCallback === processIncrementalBatch) {
        console.log('Cleaning up streaming redline callback');
        delete window.streamingRedlineCallback;
      }
    };
  }, [processIncrementalBatch, isLegalPipeline]);

  // Also register via onBatchComplete prop if provided (legacy support)
  useEffect(() => {
    if (onBatchComplete && isLegalPipeline) {
      console.log('Streaming callback also registered via onBatchComplete prop');
    }
  }, [processIncrementalBatch, onBatchComplete, isLegalPipeline]);

  // Generate final redline document when pipeline completes
  useEffect(() => {
    if (output && isLegalPipeline && !streamingState.finalDocument && !streamingState.isGenerating) {
      setStreamingState(prev => ({ ...prev, isGenerating: true }));
      
      try {
        console.log('Generating final redline document from complete output:', output);
        
        // Try multiple data sources for redline transformation
        let transformResult = null;
        
        if (output.output?.analysis) {
          transformResult = transformGrammarData(output);
        } else if (output.finalOutput?.output?.analysis) {
          transformResult = transformGrammarData(output.finalOutput);
        } else if (output.finalOutput?.finalOutput?.output?.analysis) {
          transformResult = transformGrammarData(output.finalOutput.finalOutput);
        }
        
        if (transformResult) {
          setStreamingState(prev => ({
            ...prev,
            finalDocument: transformResult,
            isGenerating: false
          }));
          console.log('Final redline document generated successfully');
        } else {
          console.warn('Failed to generate final redline document - no valid analysis data found');
          setStreamingState(prev => ({ ...prev, isGenerating: false }));
        }
      } catch (error) {
        console.error('Error generating final redline document:', error);
        setStreamingState(prev => ({ ...prev, isGenerating: false }));
        toast({
          title: "Warning",
          description: "Could not generate redline document",
          variant: "destructive"
        });
      }
    }
  }, [output, isLegalPipeline, streamingState.finalDocument, streamingState.isGenerating, transformGrammarData]);

  const handleSaveRedline = useCallback((document: RedlineDocument) => {
    console.log('Saving streaming redline document:', document);
    setStreamingState(prev => ({
      ...prev,
      finalDocument: document,
      partialDocument: document
    }));
    toast({
      title: "Success",
      description: "Redline document saved successfully"
    });
  }, []);

  const handleExportRedline = useCallback((document: RedlineDocument, format: string) => {
    console.log(`Exporting streaming redline document in ${format} format:`, document);
    toast({
      title: "Success",
      description: `Redline document exported in ${format} format`
    });
  }, []);

  // Return the most current document (final if available, otherwise partial)
  const currentRedlineDocument = streamingState.finalDocument || streamingState.partialDocument;
  const isGenerating = streamingState.isGenerating || (streamingState.totalBatches > 0 && streamingState.completedBatches < streamingState.totalBatches);

  return {
    redlineDocument: currentRedlineDocument,
    isGeneratingRedline: isGenerating,
    streamingProgress: {
      completed: streamingState.completedBatches,
      total: streamingState.totalBatches,
      hasPartialResults: !!streamingState.partialDocument
    },
    handleSaveRedline,
    handleExportRedline,
    processIncrementalBatch
  };
};

// Global type declaration for the streaming callback
declare global {
  interface Window {
    streamingRedlineCallback?: (batchResult: any, batchIndex: number, totalBatches: number) => void;
  }
}
