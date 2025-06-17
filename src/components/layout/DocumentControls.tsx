
import React from "react";
import { FolderOpen } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface DocumentControlsProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
  onUploadComplete: () => void;
  onLibraryOpen: () => void;
  onDocumentAdded?: () => void;
}

const DocumentControls: React.FC<DocumentControlsProps> = ({
  onFilesAccepted,
  onUploadComplete,
  onLibraryOpen,
  onDocumentAdded
}) => {
  return (
    <div className="flex items-center gap-4">
      <DocumentUpload 
        onFilesAccepted={onFilesAccepted} 
        onUploadComplete={onUploadComplete}
        onDocumentAdded={onDocumentAdded}
      />
      <button
        onClick={onLibraryOpen}
        className="flex items-center gap-2 border-2 border-black bg-white hover:bg-gray-100 px-3 py-2 text-sm font-bold"
      >
        <FolderOpen size={16} />
        LIBRARY
      </button>
    </div>
  );
};

export default DocumentControls;
