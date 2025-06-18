
import { useCallback } from 'react';
import { RedlineDocument } from "@/types/redlining";
import { convertGrammarAnalysisToRedline } from "@/utils/redlining/grammarToRedline";

export const useRedlineDataTransform = () => {
  const transformGrammarData = useCallback((result: any): RedlineDocument | null => {
    try {
      console.log('Transforming grammar data:', result);
      console.log('Result structure:', {
        hasOutput: !!result?.output,
        hasAnalysis: !!result?.output?.analysis,
        hasFinalOutput: !!result?.finalOutput,
        analysisLength: result?.output?.analysis?.length || 0,
        resultKeys: Object.keys(result || {})
      });
      
      // Enhanced data extraction with multiple fallback paths
      let analysisData = null;
      let sourceResult = result;
      
      // Path 1: Direct output.analysis
      if (result?.output?.analysis && Array.isArray(result.output.analysis)) {
        analysisData = result.output.analysis;
        sourceResult = result;
        console.log('Using direct output.analysis path');
      }
      
      // Path 2: finalOutput.output.analysis
      else if (result?.finalOutput?.output?.analysis && Array.isArray(result.finalOutput.output.analysis)) {
        analysisData = result.finalOutput.output.analysis;
        sourceResult = result.finalOutput;
        console.log('Using finalOutput.output.analysis path');
      }
      
      // Path 3: nested finalOutput
      else if (result?.finalOutput?.finalOutput?.output?.analysis && Array.isArray(result.finalOutput.finalOutput.output.analysis)) {
        analysisData = result.finalOutput.finalOutput.output.analysis;
        sourceResult = result.finalOutput.finalOutput;
        console.log('Using nested finalOutput path');
      }
      
      // Path 4: Direct analysis property
      else if (result?.analysis && Array.isArray(result.analysis)) {
        analysisData = result.analysis;
        sourceResult = result;
        console.log('Using direct analysis path');
      }

      if (!analysisData || !Array.isArray(analysisData) || analysisData.length === 0) {
        console.warn('No valid analysis data found in any path');
        return null;
      }

      console.log(`Found analysis data with ${analysisData.length} items`);

      // Extract original document metadata with enhanced fallback
      const originalDocument = extractOriginalDocumentInfo(result);
      console.log('Extracted original document info:', originalDocument);

      return convertGrammarAnalysisToRedline(sourceResult, originalDocument);
    } catch (error) {
      console.error('Error transforming grammar data:', error);
      return null;
    }
  }, []);

  const validateAnalysisData = useCallback((result: any): boolean => {
    // Check multiple possible paths for analysis data
    const paths = [
      result?.output?.analysis,
      result?.finalOutput?.output?.analysis,
      result?.finalOutput?.finalOutput?.output?.analysis,
      result?.analysis
    ];
    
    for (const path of paths) {
      if (path && Array.isArray(path) && path.length > 0) {
        return true;
      }
    }
    
    return false;
  }, []);

  return {
    transformGrammarData,
    validateAnalysisData
  };
};

/**
 * Enhanced original document info extraction
 */
function extractOriginalDocumentInfo(result: any) {
  // Try multiple paths for document metadata
  const metadata = result?.metadata || 
                  result?.finalOutput?.metadata || 
                  result?.input?.metadata ||
                  {};

  // Try multiple paths for original content
  let originalContent = '';
  
  const contentPaths = [
    metadata?.originalContent,
    result?.metadata?.originalContent,
    result?.input?.content,
    result?.originalContent,
    metadata?.content
  ];
  
  for (const path of contentPaths) {
    if (path && typeof path === 'string' && path.trim().length > 0) {
      originalContent = path.trim();
      break;
    }
  }

  return {
    name: metadata?.fileName || 
          result?.fileName || 
          'Document',
    type: metadata?.fileType || 
          result?.fileType || 
          'text/plain',
    content: originalContent,
    preview: metadata?.originalPreview || 
             result?.originalPreview
  };
}
