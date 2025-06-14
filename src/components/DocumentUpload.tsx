
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileInput } from "lucide-react";

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
        });
        setIsLoading(false);
        return;
      }

      // We'll add OCR and preview later! For now, just call onFilesAccepted with uploaded files.
      onFilesAccepted(files as UploadedFile[]);
      setIsLoading(false);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col gap-3 items-center justify-center border-2 border-dashed rounded-lg bg-white shadow px-6 py-10 cursor-pointer transition-colors ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
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
