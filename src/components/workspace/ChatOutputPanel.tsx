
import React, { useRef, useEffect, useState } from "react";
import { Bot, User, Copy, Download, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import DocumentResultPanel from "./DocumentResultPanel";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface DocumentResult {
  id: string;
  originalDocument: {
    name: string;
    content: string;
    type: string;
  };
  redlinedDocument: {
    content: string;
    downloadUrl?: string;
  };
  citations: Array<{
    anchor: string;
    start_offset: number;
    end_offset: number;
    original: string;
    suggested: string;
    explanation?: string;
  }>;
  processedAt: Date;
}

interface ChatOutputPanelProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
  documentResult?: DocumentResult | null;
  onDownloadRedlined?: () => void;
}

const ChatOutputPanel: React.FC<ChatOutputPanelProps> = ({
  messages,
  isLoading = false,
  className = "",
  documentResult = null,
  onDownloadRedlined
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("chat");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Switch to document tab when a result is available
  useEffect(() => {
    if (documentResult) {
      setActiveTab("document");
    }
  }, [documentResult]);

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
      {/* Header with Tabs */}
      <div className="border-b bg-gray-50 flex-shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="p-3 pb-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">GPT-4.1 Output</h3>
                <p className="text-xs text-gray-600">
                  {activeTab === "chat" ? `${messages.length} messages` : "Document processing results"}
                </p>
              </div>
              {activeTab === "chat" && messages.length > 0 && (
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
            
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare size={16} />
                Chat
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText size={16} />
                Document Result
                {documentResult && (
                  <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Chat Tab Content */}
          <TabsContent value="chat" className="flex-1 min-h-0 overflow-y-auto p-3 mt-0">
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
          </TabsContent>

          {/* Document Result Tab Content */}
          <TabsContent value="document" className="flex-1 min-h-0 mt-0">
            <DocumentResultPanel 
              documentResult={documentResult}
              onDownloadRedlined={onDownloadRedlined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatOutputPanel;
