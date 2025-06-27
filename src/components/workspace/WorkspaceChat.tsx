
import React, { useState, useEffect, useMemo } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useCitationProcessor } from "@/hooks/useCitationProcessor";
import { useDocumentPreview } from "@/hooks/useDocumentPreview";
import ChatOutputPanel from "./ChatOutputPanel";
import DocumentPreviewModal from "./DocumentPreviewModal";
import ContextDebugPanel from "./ContextDebugPanel";
import WelcomeScreen from "./WelcomeScreen";
import DocumentArea from "./DocumentArea";
import ChatInput from "./ChatInput";
import { useAnchoringStatus } from "@/hooks/useAnchoringStatus";
import { useWorkspaceMessages } from "./hooks/useWorkspaceMessages";
import { useDocumentSelection } from "./hooks/useDocumentSelection";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

interface WorkspaceChatProps {
  uploadedFiles: UploadedFile[];
  onRemoveDocument: (file: UploadedFile) => void;
  onFileDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
}

const WorkspaceChat: React.FC<WorkspaceChatProps> = ({
  uploadedFiles,
  onRemoveDocument,
  onFileDrop,
  onDragOver
}) => {
  
  const [isContextDebugOpen, setIsContextDebugOpen] = useState(false);
  
  // Use document selection hook
  const {
    selectedDocuments,
    handleDocumentToggle,
    getSelectedDocuments
  } = useDocumentSelection(uploadedFiles);

  // Use message handling hook
  const {
    messages,
    setMessages,
    isLoading,
    createWelcomeMessage,
    handleSubmit
  } = useWorkspaceMessages(uploadedFiles, selectedDocuments);

  const { 
    isProcessing: isProcessingCitations, 
    currentResult: documentResult, 
    processDocument, 
    downloadRedlinedDocument 
  } = useCitationProcessor();
  
  const { 
    isPreviewOpen, 
    selectedDocument, 
    openPreview, 
    closePreview 
  } = useDocumentPreview();

  // Initialize anchoring status tracking
  useAnchoringStatus();

  // Memoize messages length to prevent unnecessary re-renders
  const messagesLength = useMemo(() => messages.length, [messages]);

  // Set welcome message when files are first uploaded
  useEffect(() => {
    if (uploadedFiles.length > 0 && messagesLength === 0) {
      setMessages([createWelcomeMessage(uploadedFiles)]);
    }
  }, [uploadedFiles.length, messagesLength, uploadedFiles, createWelcomeMessage, setMessages]);

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Chat Input and Documents */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Welcome Message or Document Grid */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {uploadedFiles.length === 0 ? (
                <WelcomeScreen 
                  onFileDrop={onFileDrop}
                  onDragOver={onDragOver}
                />
              ) : (
                <DocumentArea
                  uploadedFiles={uploadedFiles}
                  selectedDocuments={selectedDocuments}
                  onDocumentToggle={handleDocumentToggle}
                  onRemoveDocument={onRemoveDocument}
                  onDocumentPreview={openPreview}
                />
              )}
            </div>

            {/* Chat Input Area - Fixed at bottom */}
            <ChatInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              uploadedFiles={uploadedFiles}
              selectedDocuments={getSelectedDocuments()}
              onContextDebug={() => setIsContextDebugOpen(true)}
            />
          </div>
        </ResizablePanel>

        {/* Right Panel - Chat Output */}
        <ResizableHandle />
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-hidden">
            <ChatOutputPanel 
              messages={messages} 
              isLoading={isLoading}
              documentResult={documentResult}
              onDownloadRedlined={downloadRedlinedDocument}
              className="h-full"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        document={selectedDocument}
      />

      {/* Context Debug Modal */}
      <ContextDebugPanel
        isOpen={isContextDebugOpen}
        onClose={() => setIsContextDebugOpen(false)}
        prompt=""
        documents={getSelectedDocuments()}
        model="gpt-4.1-2025-04-14"
      />
    </div>
  );
};

export default WorkspaceChat;
