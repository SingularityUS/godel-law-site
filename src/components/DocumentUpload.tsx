import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractDocumentText } from "@/hooks/workbench/utils/documentProcessor";
import { useAnchorTokenCompletionListener } from "@/hooks/workbench/useAnchorTokenCompletionListener";

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
  useAnchorTokenCompletionListener();

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
      setIsLoading(true);
      setAnalysisStatus("Uploading document...");

      const files = acceptedFiles.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.type === "text/plain"
      );

      if (files.length === 0) {
        toast({
          title: "Unsupported file type",
          description: "Only PDF, DOCX, and TXT files are allowed.",
          variant: "destructive",
        });
        setIsLoading(false);
        setAnalysisStatus("");
        return;
      }

      const file = files[0];
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

        setAnalysisStatus("Extracting text and generating anchor tokens...");

        // Extract text content using the existing processor (now with anchor tokens and event dispatch)
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

        // Create file object with both extracted and anchored text for immediate use
        const uploadedFile: UploadedFile = Object.assign(file, { 
          preview: fileUrl,
          extractedText: extractedText,
          anchoredText: anchoredText,
          anchorCount: anchorCount
        });
        
        onFilesAccepted([uploadedFile]);

        // Show success message - citation analysis will be triggered automatically by the event system
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
