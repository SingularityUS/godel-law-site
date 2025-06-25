
import React from "react";
import { Trash2, Check, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface DocumentGridProps {
  uploadedFiles: UploadedFile[];
  selectedDocuments: Set<number>;
  onDocumentToggle: (index: number, checked: boolean) => void;
  onRemoveDocument: (file: UploadedFile) => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  uploadedFiles,
  selectedDocuments,
  onDocumentToggle,
  onRemoveDocument
}) => {
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('docx')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };

  const getOCRStatus = (file: UploadedFile) => {
    if (file.extractedText) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Check size={12} />
          <span className="text-xs">Text Ready</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <Loader2 size={12} className="animate-spin" />
        <span className="text-xs">Processing...</span>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Documents ({selectedDocuments.size}/{uploadedFiles.length} selected)
        </h3>
        <p className="text-sm text-gray-600">Select documents to include in your GPT-4.1 analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uploadedFiles.map((file, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 relative group transition-all ${
              selectedDocuments.has(index) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Remove button */}
            <button
              onClick={() => onRemoveDocument(file)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1 z-10"
              title="Remove document"
            >
              <Trash2 size={12} />
            </button>

            {/* Selection checkbox */}
            <div className="absolute top-2 left-2">
              <Checkbox
                checked={selectedDocuments.has(index)}
                onCheckedChange={(checked) => onDocumentToggle(index, !!checked)}
              />
            </div>

            {/* Document preview */}
            <div className="mt-6 mb-3">
              <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-3">
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextSibling) return;
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center text-3xl';
                      fallback.textContent = getFileTypeIcon(file.type);
                      target.parentElement!.appendChild(fallback);
                    }}
                  />
                ) : (
                  <span className="text-3xl">{getFileTypeIcon(file.type)}</span>
                )}
              </div>

              {/* Document info */}
              <h4 className="font-medium text-sm text-gray-900 truncate mb-1" title={file.name}>
                {file.name}
              </h4>
              
              <div className="flex items-center justify-between">
                {getOCRStatus(file)}
                <span className="text-xs text-gray-500 capitalize">
                  {file.type.replace('application/', '').replace('text/', '')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentGrid;
