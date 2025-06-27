
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractDocumentText } from "@/hooks/workbench/utils/documentProcessor";
import { useAnchoringStatus } from "@/hooks/useAnchoringStatus";

type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string; 
  anchorCount?: number; 
};

interface DocumentUploadProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
  onUploadComplete?: () => void;
  onDocumentAdded?: () => void;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
  "text/plain": [],
};

function sanitizeFilename(filename: string): string {
  const extensionMatch = filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const extension = extensionMatch ? '.' + extensionMatch[1] : '';
  let nameWithoutExt = extension ? filename.slice(0, -extension.length) : filename;
  nameWithoutExt = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return nameWithoutExt + extension;
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

  // Enhanced file validation function
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Basic file validation
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }
    
    if (!file.name || file.name.trim() === '') {
      return { isValid: false, error: 'File has no name' };
    }
    
    if (typeof file.size !== 'number' || file.size <= 0) {
      return { isValid: false, error: 'Invalid file size' };
    }
    
    // File type validation
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    
    if (!file.type || !allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported file type' };
    }
    
    return { isValid: true };
  };

  // Enhanced file object creation with proper object structure
  const createSafeFileObject = (file: File, fileUrl: string, extractedText?: string, anchoredText?: string, anchorCount?: number): UploadedFile => {
    // Create a new object that extends the file with additional properties
    const uploadedFile = Object.create(file) as UploadedFile;
    
    // Add the additional properties we need
    uploadedFile.preview = fileUrl;
    uploadedFile.extractedText = extractedText || '';
    uploadedFile.anchoredText = anchoredText || '';
    uploadedFile.anchorCount = anchorCount || 0;
    
    return uploadedFile;
  };

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

      const sanitizedFilename = sanitizeFilename(file.name);
      const storagePath = `${user.id}/${Date.now()}_${sanitizedFilename}`;

      try {
        setAnalysisStatus("Uploading to storage...");
        
        // Upload file to storage
        const { data: uploadData, error: fileError } = await supabase
          .storage
          .from("documents")
          .upload(storagePath, file, { upsert: false });

        if (fileError) {
          throw new Error(`Upload failed: ${fileError.message}`);
        }

        const fileUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;

        // Dispatch anchoring started event
        const anchoringStartEvent = new CustomEvent('anchoringStarted', {
          detail: {
            documentName: file.name,
            source: 'upload'
          }
        });
        window.dispatchEvent(anchoringStartEvent);

        setAnalysisStatus("Extracting text and generating anchor tokens...");

        // Dispatch progress event
        const progressEvent = new CustomEvent('anchoringProgress', {
          detail: {
            documentName: file.name,
            progress: 50,
            step: 'Extracting text and generating anchor tokens...'
          }
        });
        window.dispatchEvent(progressEvent);

        // Extract text content using the existing processor
        console.log('Extracting text from uploaded document:', file.name);
        const mockNode = {
          id: 'temp',
          type: 'documentInput',
          position: { x: 0, y: 0 },
          data: {
            file: file,
            documentName: file.name,
            isUploaded: true,
            moduleType: 'document-input' as const
          }
        };

        // Pass 'upload' as source to trigger proper event dispatching
        const extractionResult = await extractDocumentText(mockNode, 'upload');
        const extractedText = extractionResult.processableContent;
        const anchoredText = extractionResult.anchoredContent;
        const anchorCount = extractionResult.anchorMap.length;

        console.log('Text extraction result:', {
          originalLength: extractionResult.metadata.originalLength,
          processableLength: extractionResult.metadata.processableLength,
          anchoredLength: extractionResult.metadata.anchoredLength,
          anchorCount: extractionResult.metadata.anchorCount,
          extractedSuccessfully: extractionResult.metadata.extractedSuccessfully
        });

        // Dispatch progress event
        const progressEvent2 = new CustomEvent('anchoringProgress', {
          detail: {
            documentName: file.name,
            progress: 90,
            step: 'Saving to database...'
          }
        });
        window.dispatchEvent(progressEvent2);

        setAnalysisStatus("Saving document to database...");

        // Insert document record with both extracted and anchored text
        const { data: docRow, error: insertError } = await supabase
          .from("documents")
          .insert([
            {
              name: file.name,
              storage_path: storagePath,
              mime_type: file.type,
              size: file.size,
              preview_url: fileUrl,
              user_id: user.id,
              extracted_text: JSON.stringify({
                original: extractedText || '',
                anchored: anchoredText || '',
                anchorCount: anchorCount
              })
            },
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        // Create safe file object with validation
        const uploadedFile = createSafeFileObject(file, fileUrl, extractedText, anchoredText, anchorCount);
        
        onFilesAccepted([uploadedFile]);

        // Dispatch anchoring completion event (this will trigger the completion status)
        const completionEvent = new CustomEvent('anchorTokensComplete', {
          detail: {
            documentName: file.name,
            documentText: extractedText || '',
            anchoredText: anchoredText || '',
            anchorCount: anchorCount,
            source: 'upload'
          }
        });
        window.dispatchEvent(completionEvent);

        // Show success message
        if (anchoredText && anchorCount > 0) {
          setAnalysisStatus("Document ready - citation analysis will start automatically...");
          
          toast({
            title: "Upload complete",
            description: `Document uploaded with ${anchorCount} anchor tokens. Citation analysis will start automatically.`,
          });
        } else {
          toast({
            title: "Upload successful",
            description: `Document uploaded and processed with ${anchorCount} anchor tokens.`,
          });
        }

        onUploadComplete?.();
        
        setTimeout(() => {
          onDocumentAdded?.();
        }, 100);

      } catch (error) {
        console.error('Upload error:', error);
        
        // Dispatch error event
        const errorEvent = new CustomEvent('anchoringError', {
          detail: {
            documentName: file.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: 'upload'
          }
        });
        window.dispatchEvent(errorEvent);
        
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
