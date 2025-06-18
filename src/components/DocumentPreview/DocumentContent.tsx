
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
      
      <style jsx>{`
        .document-content .text-center {
          text-align: center;
        }
        
        .document-content .text-right {
          text-align: right;
        }
        
        .document-content .text-justify {
          text-align: justify;
        }
        
        .document-content .text-indent {
          text-indent: 0.5in;
        }
        
        .document-content .margin-left {
          margin-left: 0.5in;
        }
        
        .document-content .document-title {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          margin: 12pt 0;
        }
        
        .document-content .heading-1 {
          font-size: 14pt;
          font-weight: bold;
          margin: 12pt 0 6pt 0;
        }
        
        .document-content .heading-2 {
          font-size: 13pt;
          font-weight: bold;
          margin: 10pt 0 6pt 0;
        }
        
        .document-content .heading-3 {
          font-size: 12pt;
          font-weight: bold;
          margin: 8pt 0 4pt 0;
        }
        
        .document-content ul {
          margin: 6pt 0;
          padding-left: 24pt;
        }
        
        .document-content li {
          margin: 3pt 0;
          line-height: 1.15;
        }
        
        .document-content u {
          text-decoration: underline;
        }
        
        .document-content s {
          text-decoration: line-through;
        }
        
        .document-content strong {
          font-weight: bold;
        }
        
        .document-content em {
          font-style: italic;
        }
        
        .document-content p {
          margin: 6pt 0;
          line-height: 1.15;
        }
        
        .document-content .list-paragraph {
          margin-left: 0.5in;
        }
        
        .formatted-document {
          line-height: 1.15;
        }
        
        .formatted-document p {
          margin: 6pt 0;
        }
      `}</style>
    </ScrollArea>
  );
};

export default DocumentContent;
