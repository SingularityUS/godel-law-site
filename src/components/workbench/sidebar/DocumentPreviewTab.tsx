
import React from "react";
import { FileText } from "lucide-react";
import { useDocumentContent } from "@/components/DocumentPreview/useDocumentContent";

interface DocumentPreviewTabProps {
  document: { name: string; type: string; preview?: string } | null;
}

const DocumentPreviewTab: React.FC<DocumentPreviewTabProps> = ({ document }) => {
  const { content, isLoading, error } = useDocumentContent(!!document, document);

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm mb-2">No Document Selected</p>
          <p className="text-xs">Drop a document onto the workspace or click a document node to preview it here</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2 text-sm">Failed to Load Document</p>
          <p className="text-gray-600 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b bg-gray-50 flex-shrink-0">
        <h3 className="font-medium text-sm text-gray-900 truncate">{document.name}</h3>
        <p className="text-xs text-gray-500 capitalize">{document.type.replace('application/', '').replace('text/', '')}</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div 
            className="prose prose-sm max-w-none document-content"
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '10pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
          >
            {document.type === "text/plain" ? (
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit',
                  margin: 0,
                  fontSize: 'inherit',
                  tabSize: 4
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div 
                className="formatted-document"
                dangerouslySetInnerHTML={{ __html: content }} 
              />
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .document-content .text-center {
          text-align: center !important;
        }
        
        .document-content .text-right {
          text-align: right !important;
        }
        
        .document-content .text-justify {
          text-align: justify !important;
        }
        
        .document-content .text-indent {
          text-indent: 0.5in !important;
        }
        
        .document-content .margin-left {
          margin-left: 0.5in !important;
        }
        
        .document-content .document-title {
          font-size: 16pt !important;
          font-weight: bold !important;
          text-align: center !important;
          margin: 12pt 0 !important;
          line-height: 1.2 !important;
        }
        
        .document-content .heading-1 {
          font-size: 14pt !important;
          font-weight: bold !important;
          margin: 12pt 0 6pt 0 !important;
          line-height: 1.2 !important;
        }
        
        .document-content .heading-2 {
          font-size: 13pt !important;
          font-weight: bold !important;
          margin: 10pt 0 6pt 0 !important;
          line-height: 1.2 !important;
        }
        
        .document-content .heading-3 {
          font-size: 12pt !important;
          font-weight: bold !important;
          margin: 8pt 0 4pt 0 !important;
          line-height: 1.2 !important;
        }
        
        .document-content ul, .document-content ol {
          margin: 6pt 0 !important;
          padding-left: 24pt !important;
        }
        
        .document-content li {
          margin: 3pt 0 !important;
          line-height: 1.15 !important;
        }
        
        .document-content u {
          text-decoration: underline !important;
        }
        
        .document-content s {
          text-decoration: line-through !important;
        }
        
        .document-content strong {
          font-weight: bold !important;
        }
        
        .document-content em {
          font-style: italic !important;
        }
        
        .document-content p {
          margin: 6pt 0 !important;
          line-height: 1.15 !important;
        }
        
        .document-content .list-paragraph {
          margin-left: 0.5in !important;
        }
        
        .document-content .tab-1 {
          margin-left: 0.5in !important;
        }
        
        .document-content .tab-2 {
          margin-left: 1in !important;
        }
        
        .document-content .tab-3 {
          margin-left: 1.5in !important;
        }
        
        .document-content .tab-4 {
          margin-left: 2in !important;
        }
        
        .formatted-document {
          line-height: 1.15 !important;
        }
        
        .formatted-document p {
          margin: 6pt 0 !important;
        }
        
        .formatted-document ul {
          list-style-type: disc !important;
          margin: 6pt 0 !important;
          padding-left: 24pt !important;
        }
        
        .formatted-document ol {
          list-style-type: decimal !important;
          margin: 6pt 0 !important;
          padding-left: 24pt !important;
        }
        
        .formatted-document li {
          margin: 3pt 0 !important;
          line-height: 1.15 !important;
        }
      `}</style>
    </div>
  );
};

export default DocumentPreviewTab;
