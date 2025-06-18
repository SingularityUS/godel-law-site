
/**
 * useEditMode Hook
 * 
 * Purpose: Manages edit mode state and content synchronization
 */

import { useState, useCallback } from "react";
import { RedlineDocument } from "@/types/redlining";

export const useEditMode = (
  document: RedlineDocument,
  onDocumentUpdate: (updatedDocument: RedlineDocument) => void
) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    console.log('Content changed in edit mode:', newContent.substring(0, 100) + '...');
    
    const updatedDocument: RedlineDocument = {
      ...document,
      currentContent: newContent,
      metadata: {
        ...document.metadata,
        lastModified: new Date().toISOString()
      }
    };

    onDocumentUpdate(updatedDocument);
    setHasUnsavedChanges(true);

    // Mark as saved after a delay (simulating auto-save)
    setTimeout(() => {
      setHasUnsavedChanges(false);
    }, 1000);
  }, [document, onDocumentUpdate]);

  const saveDocument = useCallback(() => {
    setHasUnsavedChanges(false);
    console.log('Document saved');
  }, []);

  return {
    isEditMode,
    hasUnsavedChanges,
    toggleEditMode,
    handleContentChange,
    saveDocument
  };
};
