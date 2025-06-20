
import React, { useCallback, useState, useRef } from "react";
import { LayoutGrid, FileText, BarChart3, Settings, Plus, Clock, Folder } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import WorkspaceSidebar from "@/components/workbench/WorkspaceSidebar";
import DocumentControls from "@/components/layout/DocumentControls";
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
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const handleUploadComplete = useCallback(() => {
    // Handle upload completion if needed
  }, []);

  const handleLibraryOpen = useCallback(() => {
    // Trigger library open event
    const event = new CustomEvent('openDocumentLibrary');
    window.dispatchEvent(event);
  }, []);

  const handleDocumentAdded = useCallback(() => {
    // Handle document added
  }, []);

  const handleDocumentClick = useCallback((file: UploadedFile) => {
    setSelectedDocument(file);
    
    // Show document in sidebar
    const previewEvent = new CustomEvent('showDocumentInSidebar', {
      detail: {
        name: file.name,
        type: file.type,
        preview: file.preview
      }
    });
    window.dispatchEvent(previewEvent);
    
    // Open the output panel to show the document
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

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    // Handle document drops from library
    const docData = event.dataTransfer.getData("application/lovable-document");
    if (docData) {
      const fileData = JSON.parse(docData);
      const file = {
        ...fileData,
        preview: fileData.preview,
        extractedText: fileData.extractedText
      } as UploadedFile;
      
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

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={isOutputOpen ? 70 : 100} minSize={40}>
          <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="h-full p-8 flex flex-col">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Workspace</h1>
                    <p className="text-gray-600">Your central hub for document analysis and workflow management</p>
                  </div>
                  <DocumentControls
                    onFilesAccepted={handleFilesAccepted}
                    onUploadComplete={handleUploadComplete}
                    onLibraryOpen={handleLibraryOpen}
                    onDocumentAdded={handleDocumentAdded}
                  />
                </div>
              </div>

              {/* Document Drop Zone */}
              <div 
                className="flex-1 min-h-0"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {uploadedFiles.length === 0 ? (
                  // Empty State
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
                    <div className="text-center p-8">
                      <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Drop Documents Here</h3>
                      <p className="text-gray-500 mb-4">Upload documents or drag them from the library to get started</p>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                        <span>Supported formats: PDF, DOCX, TXT</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Document Grid
                  <div className="h-full overflow-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => handleDocumentClick(file)}
                        >
                          <div className="aspect-square p-4 flex flex-col items-center justify-center">
                            {file.preview ? (
                              <div className="w-full h-full flex items-center justify-center overflow-hidden rounded">
                                <img 
                                  src={file.preview} 
                                  alt={file.name}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                                <FileText size={32} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-3 border-t">
                            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {file.name}
                            </h4>
                            <p className="text-xs text-gray-500 capitalize mt-1">
                              {file.type.replace('application/', '').replace('text/', '')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions - Only show when no documents */}
              {uploadedFiles.length === 0 && (
                <div className="mt-8">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Plus size={20} />
                      Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <button 
                        onClick={handleLibraryOpen}
                        className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        <Folder size={24} className="text-blue-600 mb-2 mx-auto" />
                        <span className="text-sm font-medium text-blue-700">Open Library</span>
                      </button>
                      <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                        <BarChart3 size={24} className="text-green-600 mb-2 mx-auto" />
                        <span className="text-sm font-medium text-green-700">Start Analysis</span>
                      </button>
                      <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                        <LayoutGrid size={24} className="text-purple-600 mb-2 mx-auto" />
                        <span className="text-sm font-medium text-purple-700">Create Workflow</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
        
        {isOutputOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={25}>
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
