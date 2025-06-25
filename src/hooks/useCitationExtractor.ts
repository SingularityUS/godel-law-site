
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

  const extractCitations = async (documentName: string, anchoredContent: string, documentType: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Extracting citations from:', documentName);
      console.log('Content length:', anchoredContent.length);
      
      const { data, error } = await supabase.functions.invoke('extract-citations', {
        body: {
          documentName,
          documentContent: anchoredContent,
          documentType
        }
      });

      if (error) {
        throw error;
      }

      console.log('Citation extraction result:', data);
      setCurrentResult(data);
      
      toast({
        title: 'Citations Extracted',
        description: `Found ${data.totalCitations} citations in ${documentName}`,
      });

      return data;
    } catch (error) {
      console.error('Citation extraction failed:', error);
      toast({
        title: 'Citation Extraction Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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
