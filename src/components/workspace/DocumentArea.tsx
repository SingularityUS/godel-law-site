
import React from "react";
import DocumentGrid from "./DocumentGrid";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

interface DocumentAreaProps {
  uploadedFiles: UploadedFile[];
  selectedDocuments: Set<number>;
  onDocumentToggle: (index: number, checked: boolean) => void;
  onRemoveDocument: (file: UploadedFile) => void;
  onDocumentPreview: (document: UploadedFile) => void;
}

const DocumentArea: React.FC<DocumentAreaProps> = ({
  uploadedFiles,
  selectedDocuments,
  onDocumentToggle,
  onRemoveDocument,
  onDocumentPreview
}) => {
  return (
    <div className="h-full p-4 overflow-auto">
      <DocumentGrid 
        uploadedFiles={uploadedFiles}
        selectedDocuments={selectedDocuments}
        onDocumentToggle={onDocumentToggle}
        onRemoveDocument={onRemoveDocument}
        onDocumentPreview={onDocumentPreview}
      />
    </div>
  );
};

export default DocumentArea;
