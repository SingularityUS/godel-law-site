
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CitationCorrection {
  anchor: string;
  start_offset: number;
  end_offset: number;
  original: string;
  suggested: string;
  explanation?: string;
}

export interface DocumentResult {
  id: string;
  originalDocument: {
    name: string;
    content: string;
    type: string;
  };
  redlinedDocument: {
    content: string;
    downloadUrl?: string;
  };
  citations: CitationCorrection[];
  processedAt: Date;
}

export const useCitationProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<DocumentResult | null>(null);

  const processDocument = useCallback(async (
    documentName: string,
    documentContent: string,
    documentType: string
  ): Promise<DocumentResult | null> => {
    setIsProcessing(true);
    
    try {
      console.log('Processing document for citations:', documentName);
      
      // Call the citation processing edge function
      const { data, error } = await supabase.functions.invoke('process-citations', {
        body: {
          documentName,
          documentContent,
          documentType
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process citations');
      }

      const result: DocumentResult = {
        id: Date.now().toString(),
        originalDocument: {
          name: documentName,
          content: documentContent,
          type: documentType
        },
        redlinedDocument: {
          content: data.redlinedContent || documentContent,
          downloadUrl: data.downloadUrl
        },
        citations: data.citations || [],
        processedAt: new Date()
      };

      setCurrentResult(result);
      
      const citationCount = result.citations.length;
      toast({
        title: "Document Processed",
        description: `Found and corrected ${citationCount} citation${citationCount !== 1 ? 's' : ''}`,
      });

      return result;
    } catch (error) {
      console.error('Citation processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document citations",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const downloadRedlinedDocument = useCallback(async () => {
    if (!currentResult?.redlinedDocument.downloadUrl) {
      toast({
        title: "Download Unavailable",
        description: "No redlined document available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      // Download the redlined DOCX file
      const response = await fetch(currentResult.redlinedDocument.downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentResult.originalDocument.name.replace(/\.[^/.]+$/, '')}_redlined.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "Redlined document downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download redlined document",
        variant: "destructive",
      });
    }
  }, [currentResult]);

  return {
    isProcessing,
    currentResult,
    processDocument,
    downloadRedlinedDocument,
    clearResult: () => setCurrentResult(null)
  };
};
