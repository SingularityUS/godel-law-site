
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
              className="prose prose-sm max-w-none"
              style={{
                fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                fontSize: '11pt',
                lineHeight: '1.15',
                color: '#000000'
              }}
            >
              {documentType === "text/plain" ? (
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
                <div dangerouslySetInnerHTML={{ __html: content }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default DocumentContent;
