
import { useState, useCallback, useMemo } from "react";
import { useChatGPTApi } from "@/hooks/workbench/useChatGPTApi";
import { buildDocumentContext } from "@/utils/contextBuilder";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const useWorkspaceMessages = (
  uploadedFiles: UploadedFile[],
  selectedDocuments: Set<number>
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { callChatGPT } = useChatGPTApi();

  // Stable function to create welcome message
  const createWelcomeMessage = useCallback((files: UploadedFile[]) => {
    const fileNames = files.map(f => f.name || 'Unnamed Document').join(", ");
    const totalAnchors = files.reduce((sum, f) => sum + (f.anchorCount || 0), 0);
    const anchorInfo = totalAnchors > 0 ? ` I've detected ${totalAnchors} anchor tokens for citation processing.` : '';
    
    return {
      id: Date.now().toString(),
      content: `I can see you've uploaded ${files.length} document(s): ${fileNames}.${anchorInfo} I'm now using GPT-4.1 with a 200K token context window for analysis. How can I help you analyze these documents?`,
      role: 'assistant' as const,
      timestamp: new Date()
    };
  }, []);

  const getSelectedDocuments = useCallback(() => {
    return uploadedFiles.filter((_, index) => selectedDocuments.has(index));
  }, [uploadedFiles, selectedDocuments]);

  const handleSubmit = useCallback(async (inputMessage: string) => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
  }, [isLoading, getSelectedDocuments, callChatGPT]);

  return {
    messages,
    setMessages,
    isLoading,
    createWelcomeMessage,
    handleSubmit,
    getSelectedDocuments
  };
};
