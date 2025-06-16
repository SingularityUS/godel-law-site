
import mammoth from "mammoth";

/**
 * Extracts and processes document content based on file type
 * Handles different file formats with appropriate processing:
 * - TXT: Direct text extraction
 * - DOCX: HTML conversion using mammoth.js
 * - PDF: Shows download message
 */
export const extractDocumentContent = async (document: {
  type: string;
  preview?: string;
}): Promise<string> => {
  if (!document.preview) {
    throw new Error("No document preview available");
  }

  if (document.type === "text/plain") {
    // Handle TXT files - fetch and display as plain text
    const response = await fetch(document.preview);
    const text = await response.text();
    return text;
  } else if (document.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // Handle DOCX files - convert to HTML using mammoth
    const response = await fetch(document.preview);
    const arrayBuffer = await response.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } else if (document.type === "application/pdf") {
    // PDF files - show download message (preview not supported)
    return `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #666; font-size: 1.1rem;">PDF files cannot be previewed in this format.</p>
        <p style="color: #666;">Please download the file to view its contents.</p>
      </div>
    `;
  }

  throw new Error("Unsupported file type");
};

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

/**
 * Handles document download by creating a temporary link
 * Triggers browser download for the document file
 */
export const handleDocumentDownload = (document: { preview?: string; name: string }): void => {
  if (document.preview) {
    const link = window.document.createElement("a");
    link.href = document.preview;
    link.download = document.name;
    link.click();
  }
};
