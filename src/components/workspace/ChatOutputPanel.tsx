
import React, { useRef, useEffect } from "react";
import { Bot, User, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatOutputPanelProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

const ChatOutputPanel: React.FC<ChatOutputPanelProps> = ({
  messages,
  isLoading = false,
  className = ""
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    });
  };

  const exportConversation = () => {
    const conversationText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}\n\n`)
      .join('');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Conversation exported to file",
    });
  };

  return (
    <div className={`flex flex-col bg-white border rounded-lg h-full max-h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="font-semibold text-gray-800">GPT-4.1 Chat Output</h3>
          <p className="text-xs text-gray-600">{messages.length} messages</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportConversation}
            className="h-7 px-2 text-xs"
          >
            <Download size={12} className="mr-1" />
            Export
          </Button>
        )}
      </div>

      {/* Messages - Fixed height with internal scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot size={48} className="mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">GPT-4.1 Ready</h4>
            <p className="text-sm">Start a conversation to see responses here</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className={`max-w-[85%] group relative ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-lg p-3'
                      : 'bg-gray-100 text-gray-900 rounded-lg p-3'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                    {message.content}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <Copy size={12} />
                  </Button>
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
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
        )}
      </div>
    </div>
  );
};

export default ChatOutputPanel;
