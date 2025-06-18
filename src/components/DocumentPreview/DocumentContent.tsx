
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface DocumentContentProps {
  content: string;
  isLoading: boolean;
  error: string | null;
  documentType?: string;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  content,
  isLoading,
  error,
  documentType,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Failed to Load Document</p>
          <p className="text-gray-600 text-sm max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(90vh-120px)]">
      <div className="bg-gray-100 min-h-full">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white shadow-lg p-16 relative min-h-[800px]">
            <div 
              className="prose prose-sm max-w-none document-content"
              style={{
                fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                fontSize: '11pt',
                lineHeight: '1.15',
                color: '#000000'
              }}
            >
              {documentType === "text/plain" ? (
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
    </ScrollArea>
  );
};

export default DocumentContent;
