
import React, { useState } from "react";
import { Send, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TokenMonitor from "./TokenMonitor";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  uploadedFiles: UploadedFile[];
  selectedDocuments: UploadedFile[];
  onContextDebug: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isLoading,
  uploadedFiles,
  selectedDocuments,
  onContextDebug
}) => {
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    onSubmit(inputMessage);
    setInputMessage("");
  };

  return (
    <div className="flex-shrink-0">
      {/* Action Buttons */}
      {uploadedFiles.length > 0 && (
        <div className="border-t bg-gray-50 p-3">
          <Button
            onClick={onContextDebug}
            disabled={selectedDocuments.length === 0 || !inputMessage.trim()}
            className="w-full flex items-center gap-2"
            variant="outline"
            size="sm"
          >
            <Code size={16} />
            Preview Context to GPT
          </Button>
        </div>
      )}

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
        
        {/* Token Monitor below input */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3">
            <TokenMonitor
              prompt={inputMessage}
              documents={selectedDocuments}
              model="gpt-4.1-2025-04-14"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
