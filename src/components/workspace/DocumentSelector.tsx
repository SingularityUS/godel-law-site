
import React from "react";
import { FileText, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTokenCount } from "@/utils/tokenCalculation";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface DocumentSelectorProps {
  documents: UploadedFile[];
  selectedDocuments: Set<number>;
  onDocumentToggle: (index: number, checked: boolean) => void;
  className?: string;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  selectedDocuments,
  onDocumentToggle,
  className = ""
}) => {
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('docx')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };

  const getOCRStatus = (file: UploadedFile) => {
    // Assume documents are processed if they have extractedText or if they're text files
    const isProcessed = file.extractedText || file.type.includes('text');
    
    if (isProcessed) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Check size={12} />
          <span className="text-xs">Text Ready</span>
        </div>
      );
    }
    
    // For demonstration, assume all uploaded files are processed
    return (
      <div className="flex items-center gap-1 text-green-600">
        <Check size={12} />
        <span className="text-xs">Text Ready</span>
      </div>
    );
  };

  const getDocumentTokens = (file: UploadedFile) => {
    // Estimate tokens from file size or extracted text
    if (file.extractedText) {
      return Math.ceil(file.extractedText.length / 4);
    }
    // Estimate based on file size (rough approximation)
    return Math.ceil(file.size / 20); // Rough estimate: 20 bytes per token
  };

  if (documents.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        <FileText size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No documents uploaded</p>
        <p className="text-xs">Drop documents here or use the upload button</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">
          Select Documents ({selectedDocuments.size}/{documents.length})
        </h3>
        <p className="text-xs text-gray-600">Choose which documents to include in your prompt</p>
      </div>
      
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {documents.map((file, index) => {
          const tokens = getDocumentTokens(file);
          return (
            <div
              key={index}
              className={`border rounded-lg p-3 transition-all ${
                selectedDocuments.has(index) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedDocuments.has(index)}
                  onCheckedChange={(checked) => onDocumentToggle(index, !!checked)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getFileTypeIcon(file.type)}</span>
                    <span className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {getOCRStatus(file)}
                    {tokens > 0 && (
                      <span className="text-xs text-gray-500">
                        {formatTokenCount(tokens)} tokens
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentSelector;
