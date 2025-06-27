
import React, { useCallback, useState, useRef } from "react";
import { FileText, Trash2 } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import DocumentControls from "@/components/layout/DocumentControls";
import WorkspaceChat from "@/components/workspace/WorkspaceChat";

export type UploadedFile = File & { preview?: string; extractedText?: string };

const WorkspaceTab: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFilesAccepted = useCallback((files: UploadedFile[]) => {
    console.log('Files accepted in workspace:', files.map(f => ({
      name: f.name,
      hasExtractedText: !!f.extractedText,
      textLength: f.extractedText?.length || 0
    })));
    
    const filesWithPreviews = files.map(file => {
      // Only create preview URL if it doesn't already exist and file is a valid File instance
      if (!file.preview && file instanceof File) {
        try {
          return {
            ...file,
            preview: URL.createObjectURL(file)
          };
        } catch (error) {
          console.warn('Failed to create preview URL for file:', file.name, error);
          return file; // Return file without preview if URL creation fails
        }
      }
      return file;
    });
    
    setUploadedFiles(prev => [...prev, ...filesWithPreviews]);
  }, []);

  const handleUploadComplete = useCallback(() => {
    // Handle upload completion if needed
  }, []);

  const handleLibraryOpen = useCallback(() => {
    const event = new CustomEvent('openDocumentLibrary');
    window.dispatchEvent(event);
  }, []);

  const handleDocumentAdded = useCallback(() => {
    // Handle document added
  }, []);

  const handleRemoveDocument = useCallback((fileToRemove: UploadedFile) => {
    console.log('Removing document:', fileToRemove.name);
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));

    // Clean up preview URL if it was created locally
    if (fileToRemove.preview && fileToRemove.preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(fileToRemove.preview);
      } catch (error) {
        console.warn('Failed to revoke object URL:', error);
      }
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const docData = event.dataTransfer.getData("application/lovable-document");
    if (docData) {
      console.log('Document dropped from library:', docData);
      const fileData = JSON.parse(docData);
      
      const file = {
        ...fileData,
        preview: fileData.preview_url || fileData.preview,
        extractedText: fileData.extractedText // Ensure extracted text is preserved
      } as UploadedFile;
      
      console.log('Processed file data with extracted text:', {
        name: file.name,
        hasExtractedText: !!file.extractedText,
        textLength: file.extractedText?.length || 0
      });
      
      setUploadedFiles(prev => [...prev, file]);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div className="h-screen max-h-screen overflow-hidden">
      <div className="h-full bg-white flex flex-col">
        {/* Header Section */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Workspace</h1>
              <p className="text-gray-600">Your central hub for document analysis and AI collaboration</p>
            </div>
            <DocumentControls
              onFilesAccepted={handleFilesAccepted}
              onUploadComplete={handleUploadComplete}
              onLibraryOpen={handleLibraryOpen}
              onDocumentAdded={handleDocumentAdded}
            />
          </div>
        </div>

        {/* Main Content Area - Chat takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <WorkspaceChat
            uploadedFiles={uploadedFiles}
            onRemoveDocument={handleRemoveDocument}
            onFileDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTab;
