
import { useCallback } from 'react';
import { RedlineDocument } from "@/types/redlining";
import { convertGrammarAnalysisToRedline } from "@/utils/redlining/grammarToRedline";

export const useRedlineDataTransform = () => {
  const transformGrammarData = useCallback((result: any): RedlineDocument | null => {
    try {
      console.log('Transforming grammar data:', result);
      
      // Validate input data
      const analysisData = result?.output?.analysis;
      if (!analysisData || !Array.isArray(analysisData) || analysisData.length === 0) {
        console.warn('No valid analysis data found');
        return null;
      }

      // Extract original document metadata
      const originalDocument = {
        name: result.metadata?.fileName || 'Document',
        type: result.metadata?.fileType || 'text/plain',
        content: result.metadata?.originalContent || result.input?.content || '',
        preview: result.metadata?.originalPreview
      };

      return convertGrammarAnalysisToRedline(result, originalDocument);
    } catch (error) {
      console.error('Error transforming grammar data:', error);
      return null;
    }
  }, []);

  const validateAnalysisData = useCallback((result: any): boolean => {
    const analysisData = result?.output?.analysis;
    return analysisData && Array.isArray(analysisData) && analysisData.length > 0;
  }, []);

  return {
    transformGrammarData,
    validateAnalysisData
  };
};
