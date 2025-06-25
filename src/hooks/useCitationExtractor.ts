
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useCitationSettings } from '@/hooks/useCitationSettings';

export interface CitationExtraction {
  anchor: string;
  start_offset: number;
  end_offset: number;
  type: string;
  status: 'Error' | 'Uncertain' | 'Correct';
  errors: string[];
  orig: string;
  suggested: string;
}

export interface CitationExtractionResult {
  citations: CitationExtraction[];
  documentName: string;
  totalCitations: number;
}

export const useCitationExtractor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<CitationExtractionResult | null>(null);
  const { getCurrentPrompt } = useCitationSettings();

  const extractCitations = async (documentName: string, anchoredContent: string, documentType: string) => {
    setIsProcessing(true);
    
    try {
      console.log('=== STARTING CITATION EXTRACTION ===');
      console.log('Document name:', documentName);
      console.log('Content length:', anchoredContent.length);
      console.log('Document type:', documentType);
      
      // Get the user's custom prompt
      const customPrompt = getCurrentPrompt();
      console.log('Using custom prompt length:', customPrompt.length);
      
      const payload = {
        documentName,
        documentContent: anchoredContent,
        documentType,
        customPrompt
      };
      
      console.log('Invoking extract-citations function with payload keys:', Object.keys(payload));
      
      const { data, error } = await supabase.functions.invoke('extract-citations', {
        body: payload
      });

      console.log('=== SUPABASE FUNCTION RESPONSE ===');
      console.log('Error:', error);
      console.log('Data:', data);

      if (error) {
        console.error('Supabase function error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(error.message || 'Failed to invoke citation extraction function');
      }

      if (!data) {
        throw new Error('No data returned from citation extraction function');
      }

      console.log('Citation extraction result:', data);
      setCurrentResult(data);
      
      toast({
        title: 'Citations Extracted',
        description: `Found ${data.totalCitations} citations in ${documentName}`,
      });

      return data;
    } catch (error) {
      console.error('=== CITATION EXTRACTION FAILED ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Citation Extraction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    currentResult,
    extractCitations,
    clearResult: () => setCurrentResult(null)
  };
};
