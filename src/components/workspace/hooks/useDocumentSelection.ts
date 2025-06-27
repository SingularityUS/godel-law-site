
import { useState, useEffect, useCallback, useMemo } from "react";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

export const useDocumentSelection = (uploadedFiles: UploadedFile[]) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());

  // Memoize uploaded files length to prevent unnecessary re-renders
  const uploadedFilesLength = useMemo(() => uploadedFiles.length, [uploadedFiles]);

  // Auto-select all documents when they're uploaded
  useEffect(() => {
    if (uploadedFilesLength > 0) {
      setSelectedDocuments(new Set(uploadedFiles.map((_, index) => index)));
    }
  }, [uploadedFilesLength, uploadedFiles]);

  const handleDocumentToggle = useCallback((index: number, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedDocuments(newSelected);
  }, [selectedDocuments]);

  const getSelectedDocuments = useCallback(() => {
    return uploadedFiles.filter((_, index) => selectedDocuments.has(index));
  }, [uploadedFiles, selectedDocuments]);

  return {
    selectedDocuments,
    handleDocumentToggle,
    getSelectedDocuments
  };
};
