
import React, { useEffect } from "react";
import { FileText, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAnchoringStatus } from "@/hooks/useAnchoringStatus";
import AnchoringStatusIndicator from "./AnchoringStatusIndicator";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

interface DocumentGridProps {
  uploadedFiles: UploadedFile[];
  selectedDocuments: Set<number>;
  onDocumentToggle: (index: number, checked: boolean) => void;
  onRemoveDocument: (file: UploadedFile) => void;
  onDocumentPreview?: (file: UploadedFile) => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  uploadedFiles,
  selectedDocuments,
  onDocumentToggle,
  onRemoveDocument,
  onDocumentPreview
}) => {
  const { getDocumentStatus, initializeDocumentStatus } = useAnchoringStatus();

  // Initialize status for all uploaded files on mount or when files change
  useEffect(() => {
    uploadedFiles.forEach(file => {
      initializeDocumentStatus(file.name, file);
    });
  }, [uploadedFiles, initializeDocumentStatus]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  // Safe file type extraction with fallback
  const getFileExtension = (file: UploadedFile): string => {
    if (!file.type) return 'FILE';
    try {
      const parts = file.type.split('/');
      return parts.length > 1 ? parts[1].toUpperCase() : 'FILE';
    } catch (error) {
      console.warn('Error extracting file extension:', error);
      return 'FILE';
    }
  };

  // Safe file size handling
  const getSafeFileSize = (file: UploadedFile): number => {
    return typeof file.size === 'number' ? file.size : 0;
  };

  // Safe file name handling
  const getSafeFileName = (file: UploadedFile): string => {
    return file.name || 'Unnamed Document';
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Document Queue ({uploadedFiles.length})
        </h3>
        <p className="text-sm text-gray-600">
          Click on documents to preview content with anchor tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uploadedFiles.map((file, index) => {
          const anchoringStatus = getDocumentStatus(getSafeFileName(file));
          const fileName = getSafeFileName(file);
          const fileSize = getSafeFileSize(file);
          const fileExtension = getFileExtension(file);
          
          return (
            <Card 
              key={index} 
              className={`relative transition-all duration-200 hover:shadow-md cursor-pointer group ${
                selectedDocuments.has(index) 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onDocumentPreview?.(file)}
            >
              <CardContent className="p-4">
                {/* Header with checkbox and remove button */}
                <div className="flex items-start justify-between mb-3">
                  <Checkbox
                    checked={selectedDocuments.has(index)}
                    onCheckedChange={(checked) => {
                      // Prevent card click when interacting with checkbox
                      event?.stopPropagation();
                      onDocumentToggle(index, !!checked);
                    }}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center gap-1">
                    {/* Preview button - visible on hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentPreview?.(file);
                      }}
                      title="Preview document"
                    >
                      <Eye size={14} />
                    </Button>
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDocument(file);
                      }}
                      title="Remove document"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>

                {/* File icon and info */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(file.type || '')}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {fileName}
                      </h4>
                      {/* Anchoring Status Indicator */}
                      <AnchoringStatusIndicator
                        status={anchoringStatus.status}
                        progress={anchoringStatus.progress}
                        message={anchoringStatus.message}
                        anchorCount={file.anchorCount}
                        className="flex-shrink-0"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileSize)} • {fileExtension}
                      </p>
                      
                      {/* Text extraction status */}
                      {file.extractedText && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {file.extractedText.length.toLocaleString()} chars
                          </Badge>
                          {file.anchorCount && file.anchorCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {file.anchorCount} anchors
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {!file.extractedText && (
                        <Badge variant="destructive" className="text-xs">
                          No text extracted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Click hint */}
                <div className="mt-3 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to preview content
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentGrid;
