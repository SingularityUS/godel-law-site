
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileInput } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UploadedFile = File & { preview?: string; extractedText?: string };

interface DocumentUploadProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
  "text/plain": [],
};

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFilesAccepted }) => {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsLoading(true);

      // Only accept PDF, DOCX, TXT
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
      const storagePath = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      let fileUrl = "";
      let uploadError = null;
      let docId: string | undefined = undefined;

      // Upload file to Supabase Storage bucket
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

      fileUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;

      // Insert metadata into documents table
      const { data: docRow, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            name: file.name,
            storage_path: storagePath,
            mime_type: file.type,
            size: file.size,
            preview_url: fileUrl,
            // user_id: undefined, // You can fill this if you add auth in the future
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

      // Attach preview_url to file type
      const uploadedFile: UploadedFile = Object.assign(file, { preview: fileUrl });
      onFilesAccepted([uploadedFile]);

      toast({
        title: "Upload successful",
        description: "Your document has been uploaded.",
      });

      setIsLoading(false);
    },
    [onFilesAccepted]
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
      className={`flex flex-col gap-3 items-center justify-center border-2 border-dashed rounded-lg bg-white shadow px-6 py-10 cursor-pointer transition-colors ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
      } ${isLoading ? "opacity-70 pointer-events-none" : ""}`}
      aria-label="File upload dropzone"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <Upload size={36} className="text-blue-500" />
        <span className="font-medium text-gray-800">Drag & drop or click to upload</span>
        <span className="text-xs text-gray-500">
          PDF, DOCX, or TXT (max 1 file at a time)
        </span>
        {isLoading && (
          <div className="text-xs text-blue-700 mt-2">Uploading and processing...</div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;

