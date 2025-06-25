
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useChatGPTApi } from "@/hooks/workbench/useChatGPTApi";
import TokenMonitor from "./TokenMonitor";
import { buildDocumentContext } from "@/utils/contextBuilder";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface WorkspaceChatProps {
  uploadedFiles: UploadedFile[];
  onFileDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
}

const WorkspaceChat: React.FC<WorkspaceChatProps> = ({
  uploadedFiles,
  onFileDrop,
  onDragOver
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { callChatGPT } = useChatGPTApi();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select all documents when they're uploaded
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      setSelectedDocuments(new Set(uploadedFiles.map((_, index) => index)));
      
      if (messages.length === 0) {
        const fileNames = uploadedFiles.map(f => f.name).join(", ");
        setMessages([{
          id: Date.now().toString(),
          content: `I can see you've uploaded ${uploadedFiles.length} document(s): ${fileNames}. I'm now using GPT-4.1 with a 200K token context window, which means I can analyze your complete documents in detail. How can I help you analyze these documents?`,
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
      
      // Build comprehensive context using the enhanced context builder
      const contextResult = buildDocumentContext(
        inputMessage,
        selectedDocs,
        180000 // Leave 20K tokens for response
      );

      const systemPrompt = "You are a helpful AI assistant powered by GPT-4.1 that specializes in analyzing and working with documents. You have access to a 200K token context window, allowing you to process complete documents in detail. Provide clear, comprehensive, and actionable insights based on the document content provided. When referencing specific parts of documents, mention the document name for clarity.";

      console.log('Sending to GPT-4.1:', {
        totalTokens: contextResult.totalTokens,
        documentsIncluded: selectedDocs.length,
        truncated: contextResult.truncated,
        excludedDocuments: contextResult.excludedDocuments
      });

      const response = await callChatGPT(
        contextResult.fullContext,
        systemPrompt,
        'gpt-4.1-2025-04-14'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      let responseContent = response.response || "I'm sorry, I couldn't generate a response.";
      
      // Add context information if documents were truncated or excluded
      if (contextResult.truncated || contextResult.excludedDocuments.length > 0) {
        const contextInfo = [];
        if (contextResult.truncated) {
          contextInfo.push("Note: Some document content was truncated due to length.");
        }
        if (contextResult.excludedDocuments.length > 0) {
          contextInfo.push(`Note: ${contextResult.excludedDocuments.length} document(s) were excluded: ${contextResult.excludedDocuments.join(', ')}`);
        }
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
    <div className="flex h-full bg-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onDrop={onFileDrop}
          onDragOver={onDragOver}
        >
          {messages.length === 0 && uploadedFiles.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Bot size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Welcome to GPT-4.1 Workspace</h3>
              <p className="text-sm mb-2">Advanced AI with 200K token context window</p>
              <p className="text-xs">Drop documents here or start a conversation to get started</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="border-t bg-white p-4">
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
        </div>
      </div>

      {/* Sidebar for Documents and Token Monitoring */}
      {uploadedFiles.length > 0 && (
        <div className="w-80 border-l bg-gray-50 flex flex-col">
          {/* Document Selection */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800 mb-3">
              Documents ({uploadedFiles.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedDocuments.has(index)}
                    onCheckedChange={(checked) => handleDocumentToggle(index, !!checked)}
                  />
                  <FileText size={16} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm truncate flex-1" title={file.name}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Token Monitor */}
          <div className="flex-1 p-4 overflow-y-auto">
            <TokenMonitor
              prompt={inputMessage}
              documents={getSelectedDocuments()}
              model="gpt-4.1-2025-04-14"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceChat;
