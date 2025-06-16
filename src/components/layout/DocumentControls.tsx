
/**
 * DocumentControls Component
 * 
 * Purpose: Document management controls for upload and library access
 * This component handles the document-related actions in the application header,
 * providing upload functionality and library access.
 * 
 * Key Responsibilities:
 * - Renders document upload component
 * - Provides library access button
 * - Handles document management callbacks
 * - Maintains consistent styling with header design
 * 
 * Integration Points:
 * - Uses DocumentUpload component for file handling
 * - Communicates with parent via callback props
 * - Coordinates with document library modal
 * - Integrates with overall header layout
 * 
 * Props:
 * - onFilesAccepted: Callback for when files are uploaded
 * - onUploadComplete: Callback for upload completion
 * - onLibraryOpen: Callback to open document library
 */

import React from "react";
import { FolderOpen } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface DocumentControlsProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
  onUploadComplete: () => void;
  onLibraryOpen: () => void;
}

const DocumentControls: React.FC<DocumentControlsProps> = ({
  onFilesAccepted,
  onUploadComplete,
  onLibraryOpen
}) => {
  return (
    <div className="flex items-center gap-4">
      <DocumentUpload 
        onFilesAccepted={onFilesAccepted} 
        onUploadComplete={onUploadComplete}
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
