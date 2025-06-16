
import React, { useState, useEffect } from "react";
import DocumentPreview from "../DocumentPreview";

/**
 * DocumentPreviewManager Component
 * 
 * Purpose: Manages document preview modal state and display
 * This component handles the document preview functionality including
 * modal state management and document data coordination.
 * 
 * Key Responsibilities:
 * - Manages preview modal open/close state
 * - Listens for document preview events from workbench
 * - Coordinates document data for preview display
 * - Provides clean separation of preview concerns
 * 
 * Integration Points:
 * - Listens to 'openDocumentPreview' custom events
 * - Uses DocumentPreview component for actual rendering
 * - Integrates with workbench via event system
 * - Maintains independent state management
 * 
 * Event Flow:
 * 1. WorkbenchFlow dispatches 'openDocumentPreview' event
 * 2. This component receives event and updates state
 * 3. DocumentPreview modal opens with document data
 * 4. User closes modal, state resets
 */

interface DocumentData {
  name: string;
  type: string;
  size: number;
  preview?: string;
  file: any;
}

const DocumentPreviewManager: React.FC = () => {
  const [previewDocument, setPreviewDocument] = useState<DocumentData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /**
   * Listen for document preview events from workbench nodes
   */
  useEffect(() => {
    const handleOpenDocumentPreview = (event: any) => {
      const documentData = event.detail;
      setPreviewDocument(documentData);
      setIsPreviewOpen(true);
    };

    window.addEventListener('openDocumentPreview', handleOpenDocumentPreview);
    return () => window.removeEventListener('openDocumentPreview', handleOpenDocumentPreview);
  }, []);

  /**
   * Handle modal close and cleanup
   */
  const handleClose = () => {
    setIsPreviewOpen(false);
    setPreviewDocument(null);
  };

  return (
    <DocumentPreview
      isOpen={isPreviewOpen}
      onClose={handleClose}
      document={previewDocument}
    />
  );
};

export default DocumentPreviewManager;
