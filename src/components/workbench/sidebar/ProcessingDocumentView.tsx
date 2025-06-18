
/**
 * ProcessingDocumentView Component
 * 
 * Purpose: Shows original document with processing notice while pipeline executes
 */

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Clock } from "lucide-react";

interface ProcessingDocumentViewProps {
  document: {
    name: string;
    type: string;
    preview?: string;
    content: string;
    size?: number;
  };
}

const ProcessingDocumentView: React.FC<ProcessingDocumentViewProps> = ({
  document
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Processing Notice Header */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <Clock size={16} className="text-blue-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Processing Document</h3>
            <p className="text-sm text-blue-700">
              Analyzing "{document.name}" for legal review...
            </p>
          </div>
        </div>
      </div>

      {/* Document Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-gray-600" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{document.name}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Type: {document.type}</span>
              {document.size && (
                <span>Size: {Math.round(document.size / 1024)} KB</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Content Preview */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="relative">
              {/* Processing Overlay */}
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processing content...</p>
                </div>
              </div>
              
              {/* Document Content */}
              <div className="prose prose-sm max-w-none text-gray-800">
                {document.preview ? (
                  <div dangerouslySetInnerHTML={{ __html: document.preview }} />
                ) : document.content ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {document.content}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Document content not available for preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ProcessingDocumentView;
