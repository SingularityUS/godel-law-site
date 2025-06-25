import React, { useState, useEffect } from "react";
import { Send, Bot, Code, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useChatGPTApi } from "@/hooks/workbench/useChatGPTApi";
import { useCitationProcessor } from "@/hooks/useCitationProcessor";
import { useCitationExtractor } from "@/hooks/useCitationExtractor";
import { useDocumentPreview } from "@/hooks/useDocumentPreview";
import TokenMonitor from "./TokenMonitor";
import DocumentSelector from "./DocumentSelector";
import ChatOutputPanel from "./ChatOutputPanel";
import DocumentGrid from "./DocumentGrid";
import DocumentPreviewModal from "./DocumentPreviewModal";
import ContextDebugPanel from "./ContextDebugPanel";
import { buildDocumentContext } from "@/utils/contextBuilder";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  const [isContextDebugOpen, setIsContextDebugOpen] = useState(false);
  
  const { callChatGPT } = useChatGPTApi();
  const { 
    isProcessing: isProcessingCitations, 
    currentResult: documentResult, 
    processDocument, 
    downloadRedlinedDocument 
  } = useCitationProcessor();
  
  const { 
    isProcessing: isExtractingCitations,
    currentResult: citationResult,
    extractCitations
  } = useCitationExtractor();
  
  const { 
    isPreviewOpen, 
    selectedDocument, 
    openPreview, 
    closePreview 
  } = useDocumentPreview();

  // Auto-select all documents when they're uploaded
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      setSelectedDocuments(new Set(uploadedFiles.map((_, index) => index)));
      
      if (messages.length === 0) {
        const fileNames = uploadedFiles.map(f => f.name).join(", ");
        const totalAnchors = uploadedFiles.reduce((sum, f) => sum + (f.anchorCount || 0), 0);
        const anchorInfo = totalAnchors > 0 ? ` I've detected ${totalAnchors} anchor tokens for citation processing.` : '';
        
        setMessages([{
          id: Date.now().toString(),
          content: `I can see you've uploaded ${uploadedFiles.length} document(s): ${fileNames}.${anchorInfo} I'm now using GPT-4.1 with a 200K token context window for analysis. How can I help you analyze these documents?`,
          role: 'assistant',
          timestamp: new Date()
        }]);
      }
    }
  }, [uploadedFiles, messages.length]);

  const getSelectedDocuments = () => {
    return uploadedFiles.filter((_, index) => selectedDocuments.has(index));
  };

  const handleDocumentToggle = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedDocuments(newSelected);
  };

  const handleExtractCitations = async () => {
    const selectedDocs = getSelectedDocuments();
    if (selectedDocs.length === 0) {
      return;
    }

    // Process the first selected document for citation extraction
    const doc = selectedDocs[0];
    const textToProcess = doc.anchoredText || doc.extractedText;
    
    if (textToProcess) {
      console.log(`Extracting citations from ${doc.name}:`, {
        hasAnchoredText: !!doc.anchoredText,
        anchorCount: doc.anchorCount || 0,
        textLength: textToProcess.length
      });
      
      await extractCitations(doc.name, textToProcess, doc.type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const selectedDocs = getSelectedDocuments();
      
      // Build comprehensive context using the enhanced context builder with anchored text
      const contextResult = buildDocumentContext(
        inputMessage,
        selectedDocs,
        180000, // Leave 20K tokens for response
        true, // Include metadata
        true  // Use anchored text for citation processing
      );

      console.log('=== CONTEXT DEBUG INFO ===');
      console.log('Sending to GPT-4.1 with anchored text:', {
        totalTokens: contextResult.totalTokens,
        documentsIncluded: selectedDocs.length,
        usingAnchoredText: contextResult.usingAnchoredText,
        totalAnchors: contextResult.totalAnchors,
        truncated: contextResult.truncated,
        excludedDocuments: contextResult.excludedDocuments,
        documentDetails: contextResult.documentContexts.map(ctx => ({
          tokenEstimate: ctx.tokenEstimate,
          useAnchoredText: ctx.useAnchoredText,
          anchorCount: ctx.anchorCount
        }))
      });
      console.log('Full context preview (first 500 chars):', contextResult.fullContext.substring(0, 500));
      console.log('=== END CONTEXT DEBUG ===');

      const systemPrompt = "You are a helpful AI assistant powered by GPT-4.1 that specializes in analyzing and working with documents. You have access to a 200K token context window, allowing you to process complete documents in detail. When documents contain anchor tokens in the format ⟦P-#####⟧, these mark paragraph positions for citation processing. Provide clear, comprehensive, and actionable insights based on the document content provided. When referencing specific parts of documents, mention the document name for clarity.";

      const response = await callChatGPT(
        contextResult.fullContext,
        systemPrompt,
        'gpt-4.1-2025-04-14'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      let responseContent = response.response || "I'm sorry, I couldn't generate a response.";
      
      // Add context information if documents were truncated or excluded, or if anchored text was used
      const contextInfo = [];
      if (contextResult.usingAnchoredText && contextResult.totalAnchors > 0) {
        contextInfo.push(`Note: Processed ${contextResult.totalAnchors} anchor tokens for citation analysis.`);
      }
      if (contextResult.truncated) {
        contextInfo.push("Note: Some document content was truncated due to length.");
      }
      if (contextResult.excludedDocuments.length > 0) {
        contextInfo.push(`Note: ${contextResult.excludedDocuments.length} document(s) were excluded: ${contextResult.excludedDocuments.join(', ')}`);
      }
      
      if (contextInfo.length > 0) {
        responseContent += `\n\n*${contextInfo.join(' ')}*`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Chat Input and Documents */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Welcome Message or Document Grid */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {uploadedFiles.length === 0 ? (
                <div 
                  className="h-full flex items-center justify-center text-center"
                  onDrop={onFileDrop}
                  onDragOver={onDragOver}
                >
                  <div className="text-gray-500">
                    <Bot size={64} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">GPT-4.1 Workspace</h3>
                    <p className="text-sm mb-2">Advanced AI with 200K token context window</p>
                    <p className="text-xs">Drop documents here or start a conversation</p>
                  </div>
                </div>
              ) : (
                <div className="h-full p-4 overflow-auto">
                  <DocumentGrid 
                    uploadedFiles={uploadedFiles}
                    selectedDocuments={selectedDocuments}
                    onDocumentToggle={handleDocumentToggle}
                    onRemoveDocument={onRemoveDocument}
                    onDocumentPreview={openPreview}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {uploadedFiles.length > 0 && (
              <div className="border-t bg-gray-50 p-3 flex-shrink-0 space-y-2">
                <Button
                  onClick={handleExtractCitations}
                  disabled={isExtractingCitations || getSelectedDocuments().length === 0}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <Search size={16} />
                  {isExtractingCitations ? 'Extracting Citations...' : 'Extract Citations (Bluebook)'}
                </Button>
                
                <Button
                  onClick={() => setIsContextDebugOpen(true)}
                  disabled={getSelectedDocuments().length === 0 || !inputMessage.trim()}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                  size="sm"
                >
                  <Code size={16} />
                  Preview Context to GPT
                </Button>
              </div>
            )}

            {/* Chat Input Area - Fixed at bottom */}
            <div className="border-t bg-white p-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={uploadedFiles.length > 0 ? "Ask about your documents..." : "Type your message..."}
                  className="flex-1 min-h-[44px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-11 px-4"
                >
                  <Send size={18} />
                </Button>
              </form>
              
              {/* Token Monitor below input */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <TokenMonitor
                    prompt={inputMessage}
                    documents={getSelectedDocuments()}
                    model="gpt-4.1-2025-04-14"
                  />
                </div>
              )}
            </div>
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
        prompt={inputMessage}
        documents={getSelectedDocuments()}
        model="gpt-4.1-2025-04-14"
      />
    </div>
  );
};

export default WorkspaceChat;
