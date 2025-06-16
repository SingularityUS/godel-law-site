
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import DocumentHeader from "./DocumentPreview/DocumentHeader";
import DocumentContent from "./DocumentPreview/DocumentContent";
import { useDocumentContent } from "./DocumentPreview/useDocumentContent";
import { DocumentPreviewProps } from "./DocumentPreview/types";

/**
 * DocumentPreview Component
 * 
 * Purpose: Provides a Word-like document viewing experience within the application
 * This modal component displays document content in a familiar format, supporting
 * multiple file types with appropriate rendering for each.
 * 
 * Supported File Types:
 * - TXT: Plain text with preserved formatting
 * - DOCX: Converted to HTML with basic styling preserved
 * - PDF: Download prompt (preview not supported)
 * 
 * Features:
 * - Word-like document styling and layout
 * - Loading states during content extraction
 * - Error handling for corrupted or unsupported files
 * - Download functionality for all file types
 * - Responsive design with proper scrolling using ScrollArea component
 * - Full scrolling support for multi-page documents
 * 
 * Integration:
 * - Used by AIWorkbench when document nodes are clicked
 * - Receives document data including file content and metadata
 * - Uses mammoth.js for DOCX to HTML conversion
 * - Integrates with toast system for user feedback
 * - Uses ScrollArea for smooth, cross-browser scrolling experience
 */

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { content, isLoading, error } = useDocumentContent(isOpen, document);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col [&>button]:hidden">
        <DocumentHeader document={document} onClose={onClose} />
        
        <div className="flex-1 min-h-0">
          <DocumentContent
            content={content}
            isLoading={isLoading}
            error={error}
            documentType={document?.type}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;
