
/**
 * useRedlineGeneration Hook
 * 
 * Purpose: Manages redline document generation logic
 * Extracted from WorkspaceSidebar for better separation of concerns
 */

import { useState, useEffect, useCallback } from "react";
import { RedlineDocument } from "@/types/redlining";
import { useRedlineDataTransform } from "@/hooks/redlining/useRedlineDataTransform";
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
  const { transformGrammarData } = useRedlineDataTransform();

  // Generate redline document when output is available
  useEffect(() => {
    if (output && isLegalPipeline && !redlineDocument && !isGeneratingRedline) {
      setIsGeneratingRedline(true);
      try {
        console.log('Generating redline document from output:', output);
        console.log('Output structure:', {
          hasOutput: !!output.output,
          hasAnalysis: !!output.output?.analysis,
          hasFinalOutput: !!output.finalOutput,
          finalOutputStructure: output.finalOutput ? Object.keys(output.finalOutput) : [],
          outputKeys: Object.keys(output)
        });
        
        // Try multiple data sources for redline transformation
        let transformResult = null;
        
        // First try: direct output
        if (output.output?.analysis) {
          transformResult = transformGrammarData(output);
        }
        
        // Second try: finalOutput
        if (!transformResult && output.finalOutput?.output?.analysis) {
          transformResult = transformGrammarData(output.finalOutput);
        }
        
        // Third try: nested finalOutput
        if (!transformResult && output.finalOutput?.finalOutput?.output?.analysis) {
          transformResult = transformGrammarData(output.finalOutput.finalOutput);
        }
        
        if (transformResult) {
          setRedlineDocument(transformResult);
          console.log('Redline document generated successfully');
        } else {
          console.warn('Failed to generate redline document - no valid analysis data found');
          console.log('Available data paths checked:', [
            'output.output.analysis',
            'output.finalOutput.output.analysis', 
            'output.finalOutput.finalOutput.output.analysis'
          ]);
        }
      } catch (error) {
        console.error('Error generating redline document:', error);
        toast({
          title: "Warning",
          description: "Could not generate redline document",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingRedline(false);
      }
    }
  }, [output, isLegalPipeline, redlineDocument, isGeneratingRedline, transformGrammarData]);

  const handleSaveRedline = useCallback((document: RedlineDocument) => {
    console.log('Saving redline document:', document);
    setRedlineDocument(document);
    toast({
      title: "Success",
      description: "Redline document saved successfully"
    });
  }, []);

  const handleExportRedline = useCallback((document: RedlineDocument, format: string) => {
    console.log(`Exporting redline document in ${format} format:`, document);
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
