
import { useState, useCallback } from 'react';

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

export const useDocumentPreview = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UploadedFile | null>(null);

  const openPreview = useCallback((document: UploadedFile) => {
    console.log('Opening document preview for:', document.name);
    console.log('Document has anchored text:', !!document.anchoredText);
    console.log('Document anchor count:', document.anchorCount || 0);
    
    setSelectedDocument(document);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    console.log('Closing document preview');
    setIsPreviewOpen(false);
    setSelectedDocument(null);
  }, []);

  return {
    isPreviewOpen,
    selectedDocument,
    openPreview,
    closePreview
  };
};
