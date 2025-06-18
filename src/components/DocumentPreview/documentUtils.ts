import mammoth from "mammoth";

/**
 * Enhanced document content extraction with comprehensive formatting preservation
 * Handles different file formats with appropriate processing and style mapping
 */
export const extractDocumentContent = async (document: {
  type: string;
  preview?: string;
}): Promise<string> => {
  if (!document.preview) {
    throw new Error("No document preview available");
  }

  if (document.type === "text/plain") {
    // Handle TXT files - fetch and display as plain text with preserved formatting
    const response = await fetch(document.preview);
    const text = await response.text();
    
    // Enhanced plain text processing to preserve tabs and spacing
    return text
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;') // Convert tabs to spaces
      .replace(/\n/g, '<br>') // Convert line breaks to HTML
      .replace(/  /g, '&nbsp;&nbsp;'); // Preserve double spaces
      
  } else if (document.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // Enhanced DOCX processing with comprehensive style mapping
    const response = await fetch(document.preview);
    const arrayBuffer = await response.arrayBuffer();
    
    // Configure mammoth with comprehensive style mappings
    const options = {
      styleMap: [
        // Paragraph styles
        "p[style-name='Title'] => h1.document-title",
        "p[style-name='Heading 1'] => h1.heading-1",
        "p[style-name='Heading 2'] => h2.heading-2",
        "p[style-name='Heading 3'] => h3.heading-3",
        "p[style-name='Heading 4'] => h4.heading-4",
        "p[style-name='Heading 5'] => h5.heading-5",
        "p[style-name='Heading 6'] => h6.heading-6",
        
        // Text alignment styles
        "p[style-name='Center'] => p.text-center",
        "p[style-name='Right'] => p.text-right",
        "p[style-name='Justify'] => p.text-justify",
        
        // List styles
        "p[style-name='List Paragraph'] => p.list-paragraph",
        "p[style-name='Normal'] => p.normal",
        
        // Character styles
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        
        // Custom mappings for common formatting
        "u => u", // Preserve underline
        "strike => s", // Preserve strikethrough
      ],
      
      // Enhanced conversion options
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      }),
      
      // Preserve more formatting elements
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true,
    };
    
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    // Post-process the HTML to enhance formatting
    let enhancedHtml = result.value;
    
    // Add CSS classes for better alignment handling
    enhancedHtml = enhancedHtml
      .replace(/<p style="text-align: center[^"]*">/g, '<p class="text-center">')
      .replace(/<p style="text-align: right[^"]*">/g, '<p class="text-right">')
      .replace(/<p style="text-align: justify[^"]*">/g, '<p class="text-justify">')
      .replace(/<p style="text-indent: [^"]*">/g, '<p class="text-indent">')
      .replace(/<p style="margin-left: [^"]*">/g, '<p class="margin-left">');
    
    // Handle numbering and bullet points better
    enhancedHtml = enhancedHtml
      .replace(/<p class="list-paragraph">/g, '<li>')
      .replace(/<\/p>(\s*<li>)/g, '</li>$1')
      .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    
    return enhancedHtml;
    
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
