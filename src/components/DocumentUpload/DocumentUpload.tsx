
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAnchoringStatus } from "@/hooks/useAnchoringStatus";
import { ACCEPTED_FILE_TYPES } from "./constants";
import { validateFile } from "./fileValidation";
import { UploadedFile } from "./fileUtils";
import { processDocumentUpload, dispatchErrorEvent } from "./eventHandlers";

interface DocumentUploadProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
  onUploadComplete?: () => void;
  onDocumentAdded?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onFilesAccepted, 
  onUploadComplete,
  onDocumentAdded 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const { user } = useAuth();
  
  // Initialize the anchor token completion listener
  useAnchoringStatus();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You must be signed in to upload documents.",
          variant: "destructive",
        });
        return;
      }

      if (acceptedFiles.length === 0) {
        toast({
          title: "No files selected",
          description: "Please select a file to upload.",
          variant: "destructive",
        });
        return;
      }

      const file = acceptedFiles[0];
      
      // Validate file before processing
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error || "The selected file is not valid.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setAnalysisStatus("Uploading document...");

      try {
        const uploadedFile = await processDocumentUpload(file, user.id, setAnalysisStatus);
        
        onFilesAccepted([uploadedFile]);

        // Show success message
        if (uploadedFile.anchoredText && uploadedFile.anchorCount && uploadedFile.anchorCount > 0) {
          setAnalysisStatus("Document ready - citation analysis will start automatically...");
          
          toast({
            title: "Upload complete",
            description: `Document uploaded with ${uploadedFile.anchorCount} anchor tokens. Citation analysis will start automatically.`,
          });
        } else {
          toast({
            title: "Upload successful",
            description: `Document uploaded and processed with ${uploadedFile.anchorCount || 0} anchor tokens.`,
          });
        }

        onUploadComplete?.();
        
        setTimeout(() => {
          onDocumentAdded?.();
        }, 100);

      } catch (error) {
        console.error('Upload error:', error);
        
        // Dispatch error event
        dispatchErrorEvent(file.name, error instanceof Error ? error.message : 'Unknown error', 'upload');
        
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setAnalysisStatus("");
      }
    },
    [onFilesAccepted, onUploadComplete, onDocumentAdded, user]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-black bg-white cursor-pointer transition-colors p-2 ${
        isDragActive ? "bg-gray-100" : ""
      } ${isLoading ? "opacity-70 pointer-events-none" : ""}`}
      style={{ fontFamily: 'Courier New, monospace' }}
      aria-label="File upload dropzone"
    >
      <input {...getInputProps()} />
      <div className="flex items-center gap-2">
        <Upload size={16} className="text-black" />
        <span className="text-xs font-bold text-black">
          {isLoading ? (analysisStatus || "PROCESSING...") : "DROP FILE OR CLICK"}
        </span>
      </div>
    </div>
  );
};

export default DocumentUpload;
