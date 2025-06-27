
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
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: string}>({});
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
          description: "Please select files to upload.",
          variant: "destructive",
        });
        return;
      }

      console.log(`📥 [UPLOAD] Processing ${acceptedFiles.length} files`);
      setIsLoading(true);
      setAnalysisStatus(`Processing ${acceptedFiles.length} document${acceptedFiles.length > 1 ? 's' : ''}...`);

      const uploadedFiles: UploadedFile[] = [];
      const errors: string[] = [];

      // Process each file individually
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileKey = `${file.name}-${i}`;
        
        console.log(`📄 [UPLOAD] Processing file ${i + 1}/${acceptedFiles.length}: ${file.name}`);
        
        // Update progress for this specific file
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: `Processing ${file.name}...`
        }));

        // Validate file before processing
        const validation = validateFile(file);
        if (!validation.isValid) {
          const errorMsg = validation.error || "The selected file is not valid.";
          errors.push(`${file.name}: ${errorMsg}`);
          
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: `Error: ${errorMsg}`
          }));
          
          console.error(`❌ [UPLOAD] Validation failed for ${file.name}:`, errorMsg);
          continue;
        }

        try {
          const uploadedFile = await processDocumentUpload(
            file, 
            user.id, 
            (status) => {
              setUploadProgress(prev => ({
                ...prev,
                [fileKey]: status
              }));
            }
          );
          
          uploadedFiles.push(uploadedFile);
          
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: `Complete: ${uploadedFile.anchorCount || 0} anchor tokens`
          }));
          
          console.log(`✅ [UPLOAD] Successfully processed ${file.name} with ${uploadedFile.anchorCount || 0} anchor tokens`);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Upload failed";
          errors.push(`${file.name}: ${errorMsg}`);
          
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: `Error: ${errorMsg}`
          }));
          
          console.error(`💥 [UPLOAD] Failed to process ${file.name}:`, error);
          
          // Dispatch error event for this specific file
          dispatchErrorEvent(file.name, errorMsg, 'upload');
        }
      }

      // Provide the successfully uploaded files to the parent component
      if (uploadedFiles.length > 0) {
        onFilesAccepted(uploadedFiles);
        
        // Show success summary
        const successCount = uploadedFiles.length;
        const totalAnchorTokens = uploadedFiles.reduce((sum, file) => sum + (file.anchorCount || 0), 0);
        
        toast({
          title: `Upload complete`,
          description: `${successCount} document${successCount > 1 ? 's' : ''} uploaded with ${totalAnchorTokens} total anchor tokens. Citation analysis will start automatically.`,
        });

        console.log(`🎉 [UPLOAD] Batch upload complete: ${successCount}/${acceptedFiles.length} files successful`);
      }

      // Show error summary if there were any failures
      if (errors.length > 0) {
        toast({
          title: `Upload issues`,
          description: `${errors.length} file${errors.length > 1 ? 's' : ''} failed to upload. Check the upload progress for details.`,
          variant: "destructive",
        });
        
        console.warn(`⚠️ [UPLOAD] Batch upload had ${errors.length} errors:`, errors);
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress({});
        setIsLoading(false);
        setAnalysisStatus("");
      }, 3000);

      onUploadComplete?.();
      
      if (uploadedFiles.length > 0) {
        setTimeout(() => {
          onDocumentAdded?.();
        }, 100);
      }
    },
    [onFilesAccepted, onUploadComplete, onDocumentAdded, user]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    // Remove maxFiles restriction to allow multiple uploads
    disabled: isLoading,
  });

  // Generate status text based on current state
  const getStatusText = () => {
    if (isLoading) {
      const progressEntries = Object.entries(uploadProgress);
      if (progressEntries.length === 1) {
        return progressEntries[0][1];
      } else if (progressEntries.length > 1) {
        return `Processing ${progressEntries.length} files...`;
      }
      return analysisStatus || "PROCESSING...";
    }
    return "DROP FILES OR CLICK";
  };

  return (
    <div className="space-y-2">
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
            {getStatusText()}
          </span>
        </div>
      </div>
      
      {/* Progress indicator for multiple uploads */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-1 text-xs">
          {Object.entries(uploadProgress).map(([fileKey, status]) => (
            <div key={fileKey} className="text-gray-600 truncate">
              {status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
