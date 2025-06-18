
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { useDocumentContent } from "@/components/DocumentPreview/useDocumentContent";

interface DocumentPreviewTabProps {
  document: { name: string; type: string; preview?: string } | null;
}

const DocumentPreviewTab: React.FC<DocumentPreviewTabProps> = ({ document }) => {
  const { content, isLoading, error } = useDocumentContent(!!document, document);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2 text-sm">Failed to Load Document</p>
          <p className="text-gray-600 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50 flex-shrink-0">
        <h3 className="font-medium text-sm text-gray-900 truncate">{document.name}</h3>
        <p className="text-xs text-gray-500 capitalize">{document.type.replace('application/', '').replace('text/', '')}</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div 
            className="prose prose-sm max-w-none"
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '10pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
          >
            {document.type === "text/plain" ? (
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
  );
};

export default DocumentPreviewTab;
