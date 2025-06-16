import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, FileText, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import mammoth from "mammoth";

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

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    type: string;
    size: number;
    preview?: string;
    file?: any;
  } | null;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  // Component state for content management
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect to extract document content when modal opens
   * Triggers content extraction based on file type
   */
  useEffect(() => {
    if (isOpen && document) {
      extractDocumentContent();
    }
  }, [isOpen, document]);

  /**
   * Extracts and processes document content based on file type
   * Handles different file formats with appropriate processing:
   * - TXT: Direct text extraction
   * - DOCX: HTML conversion using mammoth.js
   * - PDF: Shows download message
   */
  const extractDocumentContent = async () => {
    if (!document) return;

    setIsLoading(true);
    setError(null);
    setContent("");

    try {
      if (document.type === "text/plain") {
        // Handle TXT files - fetch and display as plain text
        if (document.preview) {
          const response = await fetch(document.preview);
          const text = await response.text();
          setContent(text);
        }
      } else if (document.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // Handle DOCX files - convert to HTML using mammoth
        if (document.preview) {
          const response = await fetch(document.preview);
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setContent(result.value);
        }
      } else if (document.type === "application/pdf") {
        // PDF files - show download message (preview not supported)
        setContent(`
          <div style="text-align: center; padding: 2rem;">
            <p style="color: #666; font-size: 1.1rem;">PDF files cannot be previewed in this format.</p>
            <p style="color: #666;">Please download the file to view its contents.</p>
          </div>
        `);
      }
    } catch (err) {
      console.error("Error extracting document content:", err);
      setError("Failed to load document content. The file may be corrupted or in an unsupported format.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles document download by creating a temporary link
   * Triggers browser download for the document file
   */
  const handleDownload = () => {
    if (document?.preview) {
      const link = window.document.createElement("a");
      link.href = document.preview;
      link.download = document.name;
      link.click();
    }
  };

  /**
   * Formats file size in human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
        {/* Document Header with metadata and controls */}
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {document?.name || "Document Preview"}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {document?.type} • {document ? formatFileSize(document.size) : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {document?.preview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Document Content Area with explicit height for ScrollArea */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            // Loading state with spinner
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            // Error state with user-friendly message
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Failed to Load Document</p>
                <p className="text-gray-600 text-sm max-w-md">{error}</p>
              </div>
            </div>
          ) : (
            // Document content with ScrollArea having explicit height
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="bg-gray-100 min-h-full">
                <div className="max-w-4xl mx-auto py-8 px-4">
                  <div className="bg-white shadow-lg p-16 relative min-h-[800px]">
                    <div 
                      className="prose prose-sm max-w-none"
                      style={{
                        fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                        fontSize: '11pt',
                        lineHeight: '1.15',
                        color: '#000000'
                      }}
                    >
                      {document?.type === "text/plain" ? (
                        // Plain text rendering with preserved formatting
                        <pre 
                          style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontFamily: 'inherit',
                            margin: 0,
                            fontSize: 'inherit'
                          }}
                        >
                          {content}
                        </pre>
                      ) : (
                        // HTML content rendering (for DOCX and other formats)
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;
