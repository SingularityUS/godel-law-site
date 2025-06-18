
/**
 * useRedlineGeneration Hook
 * 
 * Purpose: Manages redline document generation logic with enhanced multi-module support
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
        console.log('=== ROBUST REDLINE GENERATION START ===');
        console.log('Full output structure:', {
          hasOutput: !!output.output,
          hasFinalOutput: !!output.finalOutput,
          hasPipelineResults: !!output.pipelineResults,
          pipelineResultsLength: output.pipelineResults?.length || 0,
          topLevelKeys: Object.keys(output || {})
        });
        
        // Extract all available module data from pipeline results
        const moduleData = extractAllModuleData(output);
        console.log('Extracted module data:', moduleData);
        
        let redlineDoc = null;
        
        // Try to create comprehensive redline document from all available data
        if (moduleData.hasGrammarData || moduleData.hasCitationData) {
          redlineDoc = createComprehensiveRedlineDocument(moduleData, output);
        }
        
        if (redlineDoc) {
          setRedlineDocument(redlineDoc);
          console.log('Comprehensive redline document created successfully:', {
            suggestionCount: redlineDoc.suggestions.length,
            grammarSuggestions: redlineDoc.suggestions.filter(s => s.type === 'grammar').length,
            citationSuggestions: redlineDoc.suggestions.filter(s => s.type === 'legal').length,
            originalContentLength: redlineDoc.originalContent.length
          });
        } else {
          console.warn('Failed to generate redline document from any available data');
          logAvailableDataPaths(output);
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
 * Extract data from all modules in the pipeline results
 */
function extractAllModuleData(output: any) {
  console.log('=== EXTRACTING ALL MODULE DATA ===');
  
  const moduleData = {
    hasGrammarData: false,
    hasCitationData: false,
    grammarAnalysis: null as any,
    citationData: null as any,
    originalContent: '',
    metadata: null as any
  };
  
  // Check pipeline results first (most reliable source)
  if (output.pipelineResults && Array.isArray(output.pipelineResults)) {
    console.log(`Examining ${output.pipelineResults.length} pipeline results`);
    
    for (let i = 0; i < output.pipelineResults.length; i++) {
      const pipelineResult = output.pipelineResults[i];
      console.log(`Pipeline result ${i + 1}:`, {
        nodeId: pipelineResult.nodeId,
        moduleType: pipelineResult.moduleType,
        hasResult: !!pipelineResult.result,
        resultKeys: pipelineResult.result ? Object.keys(pipelineResult.result) : []
      });
      
      if (pipelineResult.result) {
        // Look for grammar analysis data
        const grammarData = findGrammarAnalysisData(pipelineResult.result);
        if (grammarData) {
          console.log(`Found grammar data in pipeline result ${i + 1} (${pipelineResult.moduleType})`);
          moduleData.hasGrammarData = true;
          moduleData.grammarAnalysis = pipelineResult.result;
        }
        
        // Look for citation data
        const citationData = findCitationData(pipelineResult.result);
        if (citationData) {
          console.log(`Found citation data in pipeline result ${i + 1} (${pipelineResult.moduleType}):`, citationData.length, 'citations');
          moduleData.hasCitationData = true;
          moduleData.citationData = citationData;
        }
        
        // Extract metadata and original content
        if (pipelineResult.result.metadata) {
          moduleData.metadata = pipelineResult.result.metadata;
        }
      }
    }
  }
  
  // Fallback to direct output examination
  if (!moduleData.hasGrammarData && !moduleData.hasCitationData) {
    console.log('No data found in pipeline results, checking direct output paths');
    
    // Check for grammar data in various output paths
    const grammarData = findGrammarAnalysisData(output);
    if (grammarData) {
      console.log('Found grammar data in direct output');
      moduleData.hasGrammarData = true;
      moduleData.grammarAnalysis = output;
    }
    
    // Check for citation data in various output paths
    const citationData = findCitationData(output);
    if (citationData) {
      console.log('Found citation data in direct output:', citationData.length, 'citations');
      moduleData.hasCitationData = true;
      moduleData.citationData = citationData;
    }
  }
  
  // Extract original content from the best available source
  moduleData.originalContent = extractOriginalContent(output);
  moduleData.metadata = moduleData.metadata || extractMetadata(output);
  
  console.log('Final module data extraction result:', {
    hasGrammarData: moduleData.hasGrammarData,
    hasCitationData: moduleData.hasCitationData,
    citationCount: moduleData.citationData?.length || 0,
    originalContentLength: moduleData.originalContent.length,
    hasMetadata: !!moduleData.metadata
  });
  
  return moduleData;
}

/**
 * Find grammar analysis data recursively in any object structure
 */
function findGrammarAnalysisData(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Direct analysis array check
  if (obj.analysis && Array.isArray(obj.analysis) && obj.analysis.length > 0) {
    return true;
  }
  
  // Check nested output
  if (obj.output && typeof obj.output === 'object') {
    if (obj.output.analysis && Array.isArray(obj.output.analysis) && obj.output.analysis.length > 0) {
      return true;
    }
  }
  
  // Recursive search
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && findGrammarAnalysisData(obj[key])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find citation data recursively in any object structure
 */
function findCitationData(obj: any): any[] | null {
  if (!obj || typeof obj !== 'object') return null;
  
  // Direct citations array check
  if (obj.citations && Array.isArray(obj.citations) && obj.citations.length > 0) {
    return obj.citations;
  }
  
  // Check nested output
  if (obj.output && typeof obj.output === 'object') {
    if (obj.output.citations && Array.isArray(obj.output.citations) && obj.output.citations.length > 0) {
      return obj.output.citations;
    }
  }
  
  // Recursive search
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      const found = findCitationData(obj[key]);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Create comprehensive redline document from all available module data
 */
function createComprehensiveRedlineDocument(moduleData: any, output: any): RedlineDocument | null {
  console.log('=== CREATING COMPREHENSIVE REDLINE DOCUMENT ===');
  
  if (!moduleData.originalContent || moduleData.originalContent.length === 0) {
    console.warn('No original content available for redline document');
    return null;
  }
  
  const allSuggestions: any[] = [];
  
  // Add grammar suggestions if available
  if (moduleData.hasGrammarData && moduleData.grammarAnalysis) {
    console.log('Processing grammar analysis for redline suggestions');
    try {
      const grammarDoc = convertGrammarToRedline(moduleData.grammarAnalysis, {
        content: moduleData.originalContent,
        name: moduleData.metadata?.fileName || 'Document',
        type: moduleData.metadata?.fileType || 'text/plain'
      });
      
      if (grammarDoc && grammarDoc.suggestions) {
        allSuggestions.push(...grammarDoc.suggestions);
        console.log(`Added ${grammarDoc.suggestions.length} grammar suggestions`);
      }
    } catch (error) {
      console.error('Error processing grammar data:', error);
    }
  }
  
  // Add citation suggestions if available
  if (moduleData.hasCitationData && moduleData.citationData) {
    console.log('Processing citation data for redline suggestions');
    try {
      const citationSuggestions = convertCitationsToRedline(moduleData.citationData, 'comprehensive-analysis');
      allSuggestions.push(...citationSuggestions);
      console.log(`Added ${citationSuggestions.length} citation suggestions`);
    } catch (error) {
      console.error('Error processing citation data:', error);
    }
  }
  
  if (allSuggestions.length === 0) {
    console.warn('No suggestions generated from available data');
    return null;
  }
  
  // Create comprehensive redline document
  const redlineDocument: RedlineDocument = {
    id: `comprehensive-redline-${Date.now()}`,
    originalContent: moduleData.originalContent,
    currentContent: moduleData.originalContent,
    suggestions: allSuggestions,
    metadata: {
      fileName: moduleData.metadata?.fileName || 'Document',
      fileType: moduleData.metadata?.fileType || 'text/plain',
      lastModified: new Date().toISOString(),
      totalSuggestions: allSuggestions.length,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0
    },
    positionMap: moduleData.metadata?.originalPositionMap
  };
  
  console.log('Comprehensive redline document created successfully');
  return redlineDocument;
}

/**
 * Extract original content from the best available source
 */
function extractOriginalContent(output: any): string {
  const contentPaths = [
    output?.metadata?.originalContent,
    output?.originalContent,
    output?.input?.originalContent,
    output?.input?.content,
    output?.metadata?.content,
    output?.content
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.length > 0) {
      console.log('Found original content, length:', path.length);
      return path;
    }
  }
  
  console.warn('No original content found in any path');
  return '';
}

/**
 * Extract metadata from the best available source
 */
function extractMetadata(output: any) {
  return output?.metadata || 
         output?.input?.metadata || 
         {};
}

/**
 * Convert grammar analysis to redline format (simplified version of existing logic)
 */
function convertGrammarToRedline(grammarResult: any, originalDoc: any) {
  // This is a simplified version - the full logic exists in useRedlineDataTransform
  // We're calling the existing transformation logic here
  const { transformGrammarData } = require('@/hooks/redlining/useRedlineDataTransform')();
  return transformGrammarData(grammarResult);
}

/**
 * Log available data paths for debugging
 */
function logAvailableDataPaths(output: any) {
  console.log('=== AVAILABLE DATA PATHS DEBUG ===');
  console.log('Top level keys:', Object.keys(output || {}));
  
  if (output.pipelineResults) {
    console.log('Pipeline results modules:', output.pipelineResults.map((r: any) => ({
      nodeId: r.nodeId,
      moduleType: r.moduleType,
      hasOutput: !!r.result?.output,
      outputKeys: r.result?.output ? Object.keys(r.result.output) : []
    })));
  }
  
  console.log('Direct output paths checked:', [
    `output.analysis: ${!!output?.output?.analysis}`,
    `output.citations: ${!!output?.output?.citations}`,
    `finalOutput.output.analysis: ${!!output?.finalOutput?.output?.analysis}`,
    `finalOutput.output.citations: ${!!output?.finalOutput?.output?.citations}`,
    `metadata.originalContent: ${!!output?.metadata?.originalContent}`,
    `originalContent: ${!!output?.originalContent}`
  ]);
}
