
import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { formatFileSize, handleDocumentDownload } from "./documentUtils";

interface DocumentHeaderProps {
  document: {
    name: string;
    type: string;
    size: number;
    preview?: string;
  } | null;
  onClose: () => void;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ document, onClose }) => {
  const handleDownload = () => {
    if (document) {
      handleDocumentDownload(document);
    }
  };

  return (
    <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {document?.name || "Document Preview"}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {document?.type} • {document ? formatFileSize(document.size) : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {document?.preview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>
    </DialogHeader>
  );
};

export default DocumentHeader;
