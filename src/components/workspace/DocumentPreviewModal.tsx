import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Anchor, Eye, Copy, Scale, Play, RotateCcw, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCitationAnalysis } from "@/hooks/workbench/useCitationAnalysis";

export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string;
  anchorCount?: number;
};

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UploadedFile | null;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [activeTab, setActiveTab] = useState("original");

  // Citation analysis hook
  const { 
    isProcessing, 
    citationResults, 
    error, 
    autoProcessEnabled,
    processCitations, 
    clearResults,
    toggleAutoProcess
  } = useCitationAnalysis();

  // Generate anchor tokens in real-time for preview if they don't exist
  const previewAnchoredText = useMemo(() => {
    if (!document?.extractedText) return '';
    
    // If we already have anchored text, use it
    if (document.anchoredText) {
      return document.anchoredText;
    }
    
    // Otherwise, generate it for preview
    const paragraphs = document.extractedText.split(/\n\s*\n/);
    let anchoredContent = '';
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        const anchor = `⟦P-${String(index + 1).padStart(5, '0')}⟧`;
        anchoredContent += anchor + paragraph;
        
        if (index < paragraphs.length - 1) {
          anchoredContent += '\n\n';
        }
      }
    });
    
    return anchoredContent;
  }, [document?.extractedText, document?.anchoredText]);

  const anchorCount = useMemo(() => {
    if (document?.anchorCount) return document.anchorCount;
    return (previewAnchoredText.match(/⟦P-\d{5}⟧/g) || []).length;
  }, [document?.anchorCount, previewAnchoredText]);

  const handleCopyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: `${type} content has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleProcessCitations = async () => {
    if (!previewAnchoredText.trim()) {
      toast({
        title: "No content",
        description: "No document text available for citation analysis",
        variant: "destructive",
      });
      return;
    }

    console.log('🔧 DocumentPreviewModal: Processing citations for document:', document?.name);
    await processCitations(previewAnchoredText, document?.name || 'Unknown Document');
  };

  if (!document) return null;

  const hasAnchorTags = anchorCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <span className="truncate">{document.name}</span>
              {anchorCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Anchor size={12} />
                  {anchorCount} anchors
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="text-xs">
                {document.extractedText?.length || 0} chars
              </Badge>
              {document.size && (
                <Badge variant="outline" className="text-xs">
                  {(document.size / 1024).toFixed(1)} KB
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original" className="flex items-center gap-2">
                  <FileText size={16} />
                  Original Document
                </TabsTrigger>
                <TabsTrigger value="anchored" className="flex items-center gap-2">
                  <Anchor size={16} />
                  With Anchor Tokens
                  {anchorCount > 0 && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {anchorCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="citation-data" className="flex items-center gap-2">
                  <Scale size={16} />
                  Citation Data
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Original Document Tab */}
            <TabsContent value="original" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full flex flex-col border rounded-lg bg-white">
                <div className="flex-shrink-0 p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Original Document Content</h4>
                    <p className="text-xs text-gray-600">
                      {document.extractedText?.length || 0} characters extracted from {document.type}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(document.extractedText || '', 'Original document')}
                    className="flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {document.extractedText ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono break-words">
                          {document.extractedText}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                          <p>No text content available</p>
                          <p className="text-xs mt-2">Document may not have been processed yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Anchored Document Tab */}
            <TabsContent value="anchored" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full flex flex-col border rounded-lg bg-white">
                <div className="flex-shrink-0 p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">Document with Anchor Tokens</h4>
                      <p className="text-xs text-gray-600">
                        {previewAnchoredText.length} characters with {anchorCount} anchor tokens (⟦P-#####⟧)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(previewAnchoredText, 'Anchored document')}
                      className="flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Note:</strong> Anchor tokens (⟦P-#####⟧) mark paragraph positions for citation processing. 
                    These markers help maintain accurate positions when generating redlined documents.
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {previewAnchoredText ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono break-words">
                          {/* Highlight anchor tokens for visibility */}
                          {previewAnchoredText.split(/(⟦P-\d{5}⟧)/).map((part, index) => {
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
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Anchor size={48} className="mx-auto mb-4 text-gray-400" />
                          <p>No anchored content available</p>
                          <p className="text-xs mt-2">Unable to generate anchor tokens for this document</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Citation Data Tab */}
            <TabsContent value="citation-data" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full flex flex-col border rounded-lg bg-white">
                <div className="flex-shrink-0 p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Scale size={16} className="text-blue-600" />
                        Citation Analysis
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Analyze legal citations using GPT-4.1 and The Bluebook standards
                      </p>
                    </div>
                    <Button
                      onClick={toggleAutoProcess}
                      variant={autoProcessEnabled ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Settings size={12} />
                      Auto
                    </Button>
                  </div>

                  {/* Document Status */}
                  <div className="mb-3 p-2 bg-white rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-700">Document: {document.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-600">
                            {previewAnchoredText.length.toLocaleString()} characters
                          </span>
                          {hasAnchorTags ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle size={12} />
                              {anchorCount} anchors
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600">No anchor tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessCitations}
                      disabled={isProcessing || !previewAnchoredText}
                      className="flex items-center gap-2"
                    >
                      <Play size={16} />
                      {isProcessing ? 'Analyzing...' : 'Analyze Citations'}
                    </Button>
                    
                    {citationResults && (
                      <Button
                        onClick={clearResults}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RotateCcw size={16} />
                        Clear
                      </Button>
                    )}
                  </div>

                  {!hasAnchorTags && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      ⚠️ Document lacks anchor tags (⟦P-#####⟧) needed for precise citation analysis
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {!previewAnchoredText && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                          <p className="text-sm">No document available for citation analysis</p>
                        </div>
                      )}

                      {previewAnchoredText && !citationResults && !error && !isProcessing && (
                        <div className="text-center py-8 text-gray-500">
                          <Scale size={48} className="mx-auto mb-4 text-gray-400" />
                          <p className="text-sm">Ready to analyze legal citations</p>
                          <p className="text-xs mt-1">Click 'Analyze Citations' to process the document</p>
                        </div>
                      )}

                      {isProcessing && (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-sm text-gray-600">Analyzing citations with GPT-4.1...</p>
                          <p className="text-xs text-gray-500 mt-1">Processing {anchorCount} anchor points</p>
                        </div>
                      )}

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-red-800">Analysis Error</h4>
                              <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {citationResults && (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">
                              ✓ Citation analysis completed successfully
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              Found {Array.isArray(citationResults) ? citationResults.length : 0} citations
                              {hasAnchorTags && ` with precise anchor positioning`}
                            </p>
                          </div>

                          {Array.isArray(citationResults) && citationResults.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-800">Citation Summary</h4>
                              {citationResults.map((citation, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {citation.type || 'unknown'}
                                      </span>
                                      {citation.anchor && (
                                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1 rounded">
                                          {citation.anchor}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      citation.status === 'Error' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {citation.status || 'unknown'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Original:</span> {citation.orig}
                                    </p>
                                    {citation.suggested && citation.suggested !== citation.orig && (
                                      <p className="text-sm">
                                        <span className="font-medium text-gray-700">Suggested:</span> 
                                        <span className="text-green-700"> {citation.suggested}</span>
                                      </p>
                                    )}
                                    {citation.errors && citation.errors.length > 0 && (
                                      <p className="text-sm">
                                        <span className="font-medium text-gray-700">Issues:</span> 
                                        <span className="text-red-700"> {citation.errors.join(', ')}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="p-3 border-b border-gray-200">
                              <h4 className="font-medium text-gray-800">Raw JSON Response</h4>
                            </div>
                            <div className="p-3">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border overflow-x-auto">
                                {JSON.stringify(citationResults, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
