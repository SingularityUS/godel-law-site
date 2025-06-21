
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatGPTApi } from "@/hooks/workbench/useChatGPTApi";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { callChatGPT } = useChatGPTApi();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-generate welcome message when files are uploaded
  useEffect(() => {
    if (uploadedFiles.length > 0 && messages.length === 0) {
      const fileNames = uploadedFiles.map(f => f.name).join(", ");
      setMessages([{
        id: Date.now().toString(),
        content: `I can see you've uploaded ${uploadedFiles.length} document(s): ${fileNames}. How can I help you analyze these documents?`,
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [uploadedFiles, messages.length]);

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
      // Create context about uploaded files
      let contextPrompt = inputMessage;
      if (uploadedFiles.length > 0) {
        const fileContext = uploadedFiles.map(file => 
          `File: ${file.name} (Type: ${file.type})${file.extractedText ? `\nContent Preview: ${file.extractedText.substring(0, 500)}...` : ''}`
        ).join('\n\n');
        
        contextPrompt = `Context: The user has uploaded the following documents:\n${fileContext}\n\nUser Question: ${inputMessage}`;
      }

      const response = await callChatGPT(
        contextPrompt,
        "You are a helpful AI assistant that helps users analyze and work with their documents. Provide clear, actionable insights and answers based on the document context provided."
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response || "I'm sorry, I couldn't generate a response.",
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
    <div className="flex flex-col h-full bg-white">
      {/* Chat Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onDrop={onFileDrop}
        onDragOver={onDragOver}
      >
        {messages.length === 0 && uploadedFiles.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Welcome to your AI Workspace</h3>
            <p className="text-sm">Drop documents here or start a conversation to get started</p>
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
  );
};

export default WorkspaceChat;
