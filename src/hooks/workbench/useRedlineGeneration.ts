
/**
 * useRedlineGeneration Hook
 * 
 * Purpose: Manages redline document generation logic with enhanced citation support
 * Extracted from WorkspaceSidebar for better separation of concerns
 */

import { useState, useEffect, useCallback } from "react";
import { RedlineDocument } from "@/types/redlining";
import { useRedlineDataTransform } from "@/hooks/redlining/useRedlineDataTransform";
import { convertCitationsToRedline } from "@/utils/redlining/citationToRedline";
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
  const { transformGrammarData, validateAnalysisData } = useRedlineDataTransform();

  // Generate redline document when output is available
  useEffect(() => {
    if (output && isLegalPipeline && !redlineDocument && !isGeneratingRedline) {
      setIsGeneratingRedline(true);
      try {
        console.log('Generating redline document from legal pipeline output:', output);
        console.log('Output structure analysis:', {
          hasOutput: !!output.output,
          hasAnalysis: !!output.output?.analysis,
          hasCitations: !!output.output?.citations,
          hasFinalOutput: !!output.finalOutput,
          citationCount: output.output?.citations?.length || 0,
          analysisCount: output.output?.analysis?.length || 0
        });
        
        let transformResult = null;
        
        // Try grammar analysis transformation first (most complete redline experience)
        const hasValidGrammarAnalysis = validateAnalysisData(output);
        if (hasValidGrammarAnalysis) {
          console.log('Found grammar analysis data, creating comprehensive redline document');
          transformResult = transformGrammarData(output);
        }
        
        // If no grammar analysis, try creating citation-only redline document
        if (!transformResult) {
          console.log('No grammar analysis found, checking for citation data');
          transformResult = createCitationOnlyRedlineDocument(output);
        }
        
        if (transformResult) {
          setRedlineDocument(transformResult);
          console.log('Redline document generated successfully:', {
            suggestionCount: transformResult.suggestions.length,
            hasGrammarSuggestions: transformResult.suggestions.some(s => s.type === 'grammar'),
            hasCitationSuggestions: transformResult.suggestions.some(s => s.type === 'legal')
          });
        } else {
          console.warn('Failed to generate redline document - no valid data found');
          console.log('Available data paths checked:', [
            'Grammar analysis paths (multiple)',
            'Citation data in output.citations',
            'Citation data in finalOutput.output.citations'
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
  }, [output, isLegalPipeline, redlineDocument, isGeneratingRedline, transformGrammarData, validateAnalysisData]);

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

/**
 * Create a redline document from citation data only
 */
function createCitationOnlyRedlineDocument(output: any): RedlineDocument | null {
  console.log('Attempting to create citation-only redline document');
  
  // Extract citation data from multiple possible paths
  let citationData = null;
  let sourceMetadata = null;
  
  if (output?.output?.citations && Array.isArray(output.output.citations)) {
    citationData = output.output.citations;
    sourceMetadata = output.metadata || output.output.metadata;
    console.log('Found citations in output.citations');
  } else if (output?.finalOutput?.output?.citations && Array.isArray(output.finalOutput.output.citations)) {
    citationData = output.finalOutput.output.citations;
    sourceMetadata = output.finalOutput.metadata || output.metadata;
    console.log('Found citations in finalOutput.output.citations');
  } else if (output?.citations && Array.isArray(output.citations)) {
    citationData = output.citations;
    sourceMetadata = output.metadata;
    console.log('Found citations in direct path');
  }
  
  if (!citationData || citationData.length === 0) {
    console.log('No citation data found for redline document creation');
    return null;
  }
  
  console.log(`Creating citation-only redline with ${citationData.length} citations`);
  
  // Extract original document content with enhanced fallback
  const originalDocumentInfo = extractOriginalDocumentInfo(output);
  console.log('Extracted document info for citation redline:', originalDocumentInfo);
  
  if (!originalDocumentInfo.content || originalDocumentInfo.content.length === 0) {
    console.warn('No document content available for citation redline');
    return null;
  }
  
  // Convert citations to redline suggestions
  const citationSuggestions = convertCitationsToRedline(citationData, 'citation-analysis');
  
  const redlineDocument: RedlineDocument = {
    id: `redline-${Date.now()}`,
    originalContent: originalDocumentInfo.content,
    currentContent: originalDocumentInfo.content,
    suggestions: citationSuggestions,
    metadata: {
      fileName: originalDocumentInfo.name,
      fileType: originalDocumentInfo.type,
      lastModified: new Date().toISOString(),
      totalSuggestions: citationSuggestions.length,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0
    },
    positionMap: sourceMetadata?.originalPositionMap
  };
  
  console.log('Citation-only redline document created successfully');
  return redlineDocument;
}

/**
 * Extract original document information from pipeline output
 */
function extractOriginalDocumentInfo(output: any) {
  // Try multiple paths for document metadata
  const metadata = output?.metadata || 
                  output?.finalOutput?.metadata || 
                  output?.input?.metadata ||
                  {};

  // Prioritize sources that preserve original formatting
  let originalContent = '';
  
  const contentPaths = [
    metadata?.originalContent,
    output?.metadata?.originalContent,
    output?.input?.originalContent,
    output?.originalContent,
    output?.input?.content,
    metadata?.content,
    output?.content
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.length > 0) {
      originalContent = path;
      break;
    }
  }

  return {
    name: metadata?.fileName || 
          output?.fileName || 
          'Document',
    type: metadata?.fileType || 
          output?.fileType || 
          'text/plain',
    content: originalContent,
    preview: metadata?.originalPreview || 
             output?.originalPreview
  };
}
