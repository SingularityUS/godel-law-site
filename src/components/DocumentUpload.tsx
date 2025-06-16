
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type UploadedFile = File & { preview?: string; extractedText?: string };

interface DocumentUploadProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
  onUploadComplete?: () => void;
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

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFilesAccepted, onUploadComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

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
        return;
      }

      const file = files[0];
      const sanitizedFilename = sanitizeFilename(file.name);
      const storagePath = `${user.id}/${Date.now()}_${sanitizedFilename}`;

      const { data: uploadData, error: fileError } = await supabase
        .storage
        .from("documents")
        .upload(storagePath, file, { upsert: false });

      if (fileError) {
        toast({
          title: "Upload failed",
          description: fileError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const fileUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;

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
          },
        ])
        .select()
        .single();

      if (insertError) {
        toast({
          title: "DB insert failed",
          description: insertError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const uploadedFile: UploadedFile = Object.assign(file, { preview: fileUrl });
      onFilesAccepted([uploadedFile]);
      onUploadComplete?.();

      toast({
        title: "Upload successful",
        description: "Your document has been uploaded to the library.",
      });

      setIsLoading(false);
    },
    [onFilesAccepted, onUploadComplete, user]
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
          {isLoading ? "UPLOADING..." : "DROP FILE OR CLICK"}
        </span>
      </div>
    </div>
  );
};

export default DocumentUpload;
