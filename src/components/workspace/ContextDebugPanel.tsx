
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Copy, Code, FileText, Anchor } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { buildDocumentContext, UploadedFile } from "@/utils/contextBuilder";

interface ContextDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  documents: UploadedFile[];
  model: string;
}

const ContextDebugPanel: React.FC<ContextDebugPanelProps> = ({
  isOpen,
  onClose,
  prompt,
  documents,
  model
}) => {
  const [activeTab, setActiveTab] = useState("summary");

  // Build the context to show what would be sent to GPT
  const contextResult = buildDocumentContext(
    prompt,
    documents,
    180000, // Leave 20K tokens for response
    true, // Include metadata
    true  // Use anchored text
  );

  const handleCopyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: `${type} has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={20} />
              <span>Context Debug Panel</span>
              <Badge variant="secondary">{model}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {formatTokens(contextResult.totalTokens)} tokens
              </Badge>
              {contextResult.usingAnchoredText && (
                <Badge variant="default" className="bg-blue-600">
                  {contextResult.totalAnchors} anchors
                </Badge>
              )}
              {contextResult.truncated && (
                <Badge variant="destructive">Truncated</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <Eye size={16} />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="context" className="flex items-center gap-2">
                  <FileText size={16} />
                  Full Context
                </TabsTrigger>
                <TabsTrigger value="anchors" className="flex items-center gap-2">
                  <Anchor size={16} />
                  Anchor Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Summary Tab */}
            <TabsContent value="summary" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Context Statistics */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-medium mb-3">Context Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Tokens:</span>
                          <div className="font-mono font-medium">{formatTokens(contextResult.totalTokens)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Documents:</span>
                          <div className="font-mono font-medium">{contextResult.documentContexts.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Anchor Tokens:</span>
                          <div className="font-mono font-medium">{contextResult.totalAnchors}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Using Anchored Text:</span>
                          <div className="font-mono font-medium">
                            {contextResult.usingAnchoredText ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document Processing Status */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3">Document Processing Status</h3>
                      <div className="space-y-3">
                        {contextResult.documentContexts.map((docContext, index) => {
                          const doc = documents[index];
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <FileText size={16} className="text-blue-500" />
                                <div>
                                  <div className="font-medium text-sm">{doc?.name || `Document ${index + 1}`}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatTokens(docContext.tokenEstimate)} tokens
                                    {docContext.useAnchoredText && docContext.anchorCount && (
                                      <span className="ml-2">• {docContext.anchorCount} anchors</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {docContext.useAnchoredText && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Anchor size={12} className="mr-1" />
                                    Anchored
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  Included
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        
                        {contextResult.excludedDocuments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-red-600 mb-2">Excluded Documents:</h4>
                            {contextResult.excludedDocuments.map((name, index) => (
                              <div key={index} className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                {name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h3 className="font-medium mb-3 text-green-800">Verification Checklist</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${documents.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>Documents uploaded: {documents.length > 0 ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${contextResult.totalAnchors > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span>Anchor tokens present: {contextResult.totalAnchors > 0 ? `Yes (${contextResult.totalAnchors})` : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${contextResult.usingAnchoredText ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span>Using anchored text: {contextResult.usingAnchoredText ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${!contextResult.truncated ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span>Content truncation: {contextResult.truncated ? 'Yes (some content truncated)' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Full Context Tab */}
            <TabsContent value="context" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full flex flex-col border rounded-lg bg-white">
                <div className="flex-shrink-0 p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Full Context Sent to GPT-4.1</h4>
                    <p className="text-xs text-gray-600">
                      This is the exact prompt that will be sent to the AI model
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(contextResult.fullContext, 'Full context')}
                    className="flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono break-words">
                        {contextResult.fullContext.split(/(⟦P-\d{5}⟧)/).map((part, index) => {
                          if (part.match(/⟦P-\d{5}⟧/)) {
                            return (
                              <span 
                                key={index} 
                                className="bg-yellow-200 text-yellow-800 px-1 rounded text-xs font-bold border border-yellow-300"
                                title="Anchor token - marks paragraph position"
                              >
                                {part}
                              </span>
                            );
                          }
                          return <span key={index}>{part}</span>;
                        })}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Anchor Analysis Tab */}
            <TabsContent value="anchors" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {contextResult.documentContexts.map((docContext, index) => {
                      const doc = documents[index];
                      if (!docContext.useAnchoredText || !docContext.anchorCount) return null;
                      
                      const anchors = docContext.content.match(/⟦P-\d{5}⟧/g) || [];
                      
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <FileText size={16} />
                            {doc?.name || `Document ${index + 1}`}
                            <Badge variant="secondary">{docContext.anchorCount} anchors</Badge>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {anchors.slice(0, 50).map((anchor, anchorIndex) => (
                              <div key={anchorIndex} className="font-mono text-xs bg-yellow-100 border border-yellow-300 rounded px-2 py-1">
                                {anchor}
                              </div>
                            ))}
                            {anchors.length > 50 && (
                              <div className="text-xs text-gray-500 p-2">
                                ... and {anchors.length - 50} more anchors
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {contextResult.totalAnchors === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Anchor size={48} className="mx-auto mb-4 text-gray-400" />
                        <p>No anchor tokens found in the current context</p>
                        <p className="text-xs mt-2">Upload documents with processed text to see anchor analysis</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContextDebugPanel;
