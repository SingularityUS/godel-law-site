
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useCitationSettings } from '@/hooks/useCitationSettings';

export interface CitationAnalysisResult {
  documentName: string;
  rawResponse: string;
  parsedData: any;
  success: boolean;
  error?: string;
}

export const useCitationAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CitationAnalysisResult | null>(null);
  const { getCurrentPrompt } = useCitationSettings();

  const analyzeCitations = async (documentName: string, documentContent: string) => {
    setIsAnalyzing(true);
    
    try {
      console.log('Starting citation analysis for:', documentName);
      
      const prompt = getCurrentPrompt();
      
      const { data, error } = await supabase.functions.invoke('analyze-citations', {
        body: {
          documentName,
          documentContent,
          prompt
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to analyze citations');
      }

      if (!data) {
        throw new Error('No data returned from analysis');
      }

      console.log('Citation analysis completed:', data);
      setAnalysisResult(data);
      
      if (data.success) {
        toast({
          title: 'Analysis Complete',
          description: `Citation analysis completed for ${documentName}`,
        });
      }

      return data;
    } catch (error) {
      console.error('Citation analysis failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResult = () => {
    setAnalysisResult(null);
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeCitations,
    clearResult
  };
};
