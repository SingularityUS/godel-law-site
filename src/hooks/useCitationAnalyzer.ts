
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
      console.log('=== CITATION ANALYSIS DEBUG ===');
      console.log('Starting citation analysis for:', documentName);
      console.log('Document content length:', documentContent?.length || 0);
      console.log('Document content preview (first 200 chars):', documentContent?.substring(0, 200));
      
      const prompt = getCurrentPrompt();
      console.log('Using prompt length:', prompt?.length || 0);
      console.log('Prompt preview (first 100 chars):', prompt?.substring(0, 100));
      
      if (!documentContent || documentContent.trim().length === 0) {
        throw new Error('Document content is empty or invalid');
      }
      
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Citation prompt is not configured');
      }

      console.log('Calling analyze-citations function...');
      
      const { data, error } = await supabase.functions.invoke('analyze-citations', {
        body: {
          documentName,
          documentContent,
          prompt
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        console.error('No data returned from function');
        throw new Error('No data returned from analysis function');
      }

      console.log('Analysis completed successfully. Data keys:', Object.keys(data));
      setAnalysisResult(data);
      
      if (data.success) {
        toast({
          title: 'Analysis Complete',
          description: `Citation analysis completed for ${documentName}`,
        });
      } else {
        toast({
          title: 'Analysis Warning',
          description: data.error || 'Analysis completed with warnings',
          variant: 'destructive',
        });
      }

      return data;
    } catch (error) {
      console.error('=== CITATION ANALYSIS ERROR ===');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during analysis';
      
      console.error('Final error message:', errorMessage);
      
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsAnalyzing(false);
      console.log('=== END CITATION ANALYSIS ===');
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
