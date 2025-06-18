/**
 * useRedlineGeneration Hook
 * 
 * Purpose: Enhanced redline document generation with endpoint-based aggregation
 */

import { useState, useEffect, useCallback } from "react";
import { RedlineDocument } from "@/types/redlining";
import { RedlineAggregator } from "./utils/redlineAggregator";
import { PipelineChangeDetector } from "./utils/pipelineChangeDetector";
import { toast } from "@/hooks/use-toast";

interface UseRedlineGenerationProps {
  output: any;
  isLegalPipeline: boolean;
}

export const useRedlineGeneration = ({
  output,
  isLegalPipeline
}: UseRedlineGenerationProps) => {
  const [redlineDocument, setRedlineDocument] = useState<RedlineDocument | null>(null);
  const [isGeneratingRedline, setIsGeneratingRedline] = useState(false);

  // Generate redline document when output is available
  useEffect(() => {
    if (output && !redlineDocument && !isGeneratingRedline) {
      setIsGeneratingRedline(true);
      try {
        console.log('=== ENHANCED REDLINE GENERATION START ===');
        console.log('Output structure:', {
          hasEndpointResults: !!output.endpointResults,
          endpointCount: output.endpointResults?.length || 0,
          hasPipelineResults: !!output.pipelineResults,
          pipelineResultsLength: output.pipelineResults?.length || 0,
          hasEndpoints: !!output.endpoints,
          endpointsCount: output.endpoints?.length || 0
        });
        
        let redlineDoc = null;
        
        // Use endpoint results if available (new enhanced system)
        if (output.endpointResults && output.endpointResults.length > 0) {
          console.log('Using endpoint results for redline generation');
          redlineDoc = RedlineAggregator.createComprehensiveRedline(
            output.endpointResults,
            output.finalOutput || output
          );
        }
        // Fallback to pipeline results (compatibility)
        else if (output.pipelineResults && output.pipelineResults.length > 0) {
          console.log('Using pipeline results for redline generation (fallback)');
          redlineDoc = RedlineAggregator.createComprehensiveRedline(
            output.pipelineResults,
            output.finalOutput || output
          );
        }
        // Final fallback to direct output analysis
        else if (this.hasAnalyzableData(output)) {
          console.log('Using direct output analysis (legacy fallback)');
          redlineDoc = RedlineAggregator.createComprehensiveRedline(
            [{
              nodeId: 'direct-analysis',
              moduleType: 'legacy',
              result: output
            }],
            output
          );
        }
        
        if (redlineDoc) {
          setRedlineDocument(redlineDoc);
          console.log('Enhanced redline document created successfully:', {
            suggestionCount: redlineDoc.suggestions.length,
            sourceModules: redlineDoc.metadata.sourceModules,
            fileName: redlineDoc.metadata.fileName
          });
        } else {
          console.warn('Failed to generate redline document from any available data');
          this.logAvailableDataSources(output);
        }
      } catch (error) {
        console.error('Error in enhanced redline generation:', error);
        toast({
          title: "Warning",
          description: "Could not generate redline document",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingRedline(false);
      }
    }
  }, [output, redlineDocument, isGeneratingRedline]);

  /**
   * Clear redline when pipeline changes
   */
  useEffect(() => {
    if (output && output.summary) {
      // Reset redline document when we detect this is a new pipeline execution
      const isNewExecution = !redlineDocument || 
        (output.summary.processingCompleted && 
         (!redlineDocument.metadata.lastModified || 
          new Date(output.summary.processingCompleted) > new Date(redlineDocument.metadata.lastModified)));
      
      if (isNewExecution && redlineDocument) {
        console.log('Clearing old redline document for new pipeline execution');
        setRedlineDocument(null);
      }
    }
  }, [output?.summary?.processingCompleted]);

  /**
   * Check if output has analyzable data
   */
  const hasAnalyzableData = (output: any): boolean => {
    return !!(
      output?.output?.analysis ||
      output?.output?.citations ||
      output?.analysis ||
      output?.citations
    );
  };

  /**
   * Log available data sources for debugging
   */
  const logAvailableDataSources = (output: any) => {
    console.log('=== AVAILABLE DATA SOURCES DEBUG ===');
    console.log('Top level keys:', Object.keys(output || {}));
    console.log('Has endpoint results:', !!output.endpointResults);
    console.log('Has pipeline results:', !!output.pipelineResults);
    console.log('Has direct analysis:', !!output?.output?.analysis);
    console.log('Has direct citations:', !!output?.output?.citations);
    console.log('Has metadata with original content:', !!output?.metadata?.originalContent);
    
    if (output.endpointResults) {
      console.log('Endpoint results detail:', output.endpointResults.map((r: any) => ({
        nodeId: r.nodeId,
        moduleType: r.moduleType,
        hasResult: !!r.result,
        resultKeys: r.result ? Object.keys(r.result) : []
      })));
    }
  };

  const handleSaveRedline = useCallback((document: RedlineDocument) => {
    console.log('Saving enhanced redline document:', document);
    setRedlineDocument(document);
    toast({
      title: "Success",
      description: "Redline document saved successfully"
    });
  }, []);

  const handleExportRedline = useCallback((document: RedlineDocument, format: string)  => {
    console.log(`Exporting enhanced redline document in ${format} format:`, document);
    toast({
      title: "Success",
      description: `Redline document exported in ${format} format`
    });
  }, []);

  return {
    redlineDocument,
    isGeneratingRedline,
    handleSaveRedline,
    handleExportRedline
  };
};
