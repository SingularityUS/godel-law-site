
import React, { useCallback, useState, useRef } from "react";
import { FileText, Trash2 } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import WorkspaceSidebar from "@/components/workbench/WorkspaceSidebar";
import DocumentControls from "@/components/layout/DocumentControls";
import WorkspaceChat from "@/components/workspace/WorkspaceChat";
import { useOutputPanel } from "@/hooks/workbench/useOutputPanel";
import { useDocumentContext } from "@/hooks/workbench/useDocumentContext";

export type UploadedFile = File & { preview?: string; extractedText?: string };

const WorkspaceTab: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<UploadedFile | null>(null);
  const workbenchRef = useRef<any>(null);

  const { 
    output, 
    isOutputOpen, 
    isProcessing, 
    processingDocument,
    closeOutput, 
    toggleOutput, 
    openOutput,
    startProcessing
  } = useOutputPanel();
  
  const { extractDocumentFromNodes } = useDocumentContext();

  const handleFilesAccepted = useCallback((files: UploadedFile[]) => {
    console.log('Files accepted in workspace:', files);
    const filesWithPreviews = files.map(file => ({
      ...file,
      preview: file.preview || (file instanceof File ? URL.createObjectURL(file) : undefined)
    }));
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

  const handleDocumentClick = useCallback((file: UploadedFile) => {
    console.log('Document clicked:', file);
    setSelectedDocument(file);
    
    const previewEvent = new CustomEvent('showDocumentInSidebar', {
      detail: {
        name: file.name,
        type: file.type,
        preview: file.preview
      }
    });
    window.dispatchEvent(previewEvent);
    
    openOutput({
      output: {
        document: {
          name: file.name,
          type: file.type,
          preview: file.preview
        }
      }
    });
  }, [openOutput]);

  const handleRemoveDocument = useCallback((fileToRemove: UploadedFile, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Removing document:', fileToRemove.name);
    
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));
    
    if (selectedDocument === fileToRemove) {
      setSelectedDocument(null);
      closeOutput();
    }

    // Clean up preview URL if it was created locally
    if (fileToRemove.preview && fileToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  }, [selectedDocument, closeOutput]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const docData = event.dataTransfer.getData("application/lovable-document");
    if (docData) {
      console.log('Document dropped from library:', docData);
      const fileData = JSON.parse(docData);
      
      const file = {
        ...fileData,
        preview: fileData.preview_url || fileData.preview,
        extractedText: fileData.extractedText || fileData.extracted_text
      } as UploadedFile;
      
      console.log('Processed file data:', file);
      setUploadedFiles(prev => [...prev, file]);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleClose = () => {
    closeOutput();
    setSelectedDocument(null);
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('docx')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={isOutputOpen ? 50 : 100} minSize={30}>
          <div className="h-full bg-white">
            <div className="h-full flex flex-col">
              {/* Header Section */}
              <div className="p-6 border-b">
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

              {/* Main Content Area - Chat and Documents */}
              <div className="flex-1 flex min-h-0">
                {/* Chat Area */}
                <div className="flex-1 min-w-0">
                  <WorkspaceChat
                    uploadedFiles={uploadedFiles}
                    onFileDrop={handleDrop}
                    onDragOver={handleDragOver}
                  />
                </div>

                {/* Documents Sidebar */}
                {uploadedFiles.length > 0 && (
                  <div className="w-80 border-l bg-gray-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-800">Documents ({uploadedFiles.length})</h3>
                    </div>
                    <div className="p-4 h-full overflow-y-auto">
                      <div className="space-y-3">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer group relative"
                            onClick={() => handleDocumentClick(file)}
                          >
                            <button
                              onClick={(e) => handleRemoveDocument(file, e)}
                              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                              title="Remove document"
                            >
                              <Trash2 size={12} />
                            </button>

                            <div className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  {file.preview ? (
                                    <img 
                                      src={file.preview} 
                                      alt={file.name}
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        if (target.nextSibling) return;
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full h-full flex items-center justify-center text-lg';
                                        fallback.textContent = getFileTypeIcon(file.type);
                                        target.parentElement!.appendChild(fallback);
                                      }}
                                    />
                                  ) : (
                                    <span className="text-lg">{getFileTypeIcon(file.type)}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                                    {file.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {file.type.replace('application/', '').replace('text/', '')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
        
        {isOutputOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <WorkspaceSidebar 
                output={output}
                isOpen={isOutputOpen}
                isProcessing={isProcessing}
                processingDocument={processingDocument}
                onClose={handleClose}
                onToggle={toggleOutput}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default WorkspaceTab;
