import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Anchor, Eye, Copy, Search, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCitationExtractor, CitationExtraction } from "@/hooks/useCitationExtractor";
import CitationHighlighter from "./CitationHighlighter";
import CitationDetailModal from "./CitationDetailModal";

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
  const [selectedCitation, setSelectedCitation] = useState<CitationExtraction | null>(null);
  const [isCitationDetailOpen, setIsCitationDetailOpen] = useState(false);
  
  const { isProcessing, currentResult, extractCitations } = useCitationExtractor();

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

  const handleExtractCitations = async () => {
    if (!document || !previewAnchoredText) return;
    
    await extractCitations(document.name, previewAnchoredText, document.type);
    
    // Switch to citations tab after extraction
    setActiveTab("citations");
  };

  const handleCitationClick = (citation: CitationExtraction) => {
    setSelectedCitation(citation);
    setIsCitationDetailOpen(true);
  };

  const getCitationStats = () => {
    if (!currentResult?.citations) return null;
    
    const total = currentResult.citations.length;
    const errors = currentResult.citations.filter(c => c.status === 'Error').length;
    const uncertain = currentResult.citations.filter(c => c.status === 'Uncertain').length;
    const correct = currentResult.citations.filter(c => c.status === 'Correct').length;
    
    return { total, errors, uncertain, correct };
  };

  const stats = getCitationStats();

  if (!document) return null;

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
              {stats && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Search size={12} />
                  {stats.total} citations
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
                <TabsTrigger value="citations" className="flex items-center gap-2">
                  <Search size={16} />
                  Citation Analysis
                  {stats && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {stats.total}
                    </Badge>
                  )}
                  {stats && stats.errors > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {stats.errors} errors
                    </Badge>
                  )}
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

            {/* Citation Analysis Tab */}
            <TabsContent value="citations" className="flex-1 min-h-0 m-0 p-6 pt-4">
              <div className="h-full flex flex-col border rounded-lg bg-white">
                <div className="flex-shrink-0 p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">Legal Citation Analysis</h4>
                      <p className="text-xs text-gray-600">
                        Bluebook format compliance check with highlighted citations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!currentResult && (
                        <Button
                          onClick={handleExtractCitations}
                          disabled={isProcessing || !previewAnchoredText}
                          className="flex items-center gap-1"
                          size="sm"
                        >
                          <Search size={14} />
                          {isProcessing ? 'Analyzing...' : 'Extract Citations'}
                        </Button>
                      )}
                      {currentResult && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyToClipboard(previewAnchoredText, 'Citation-highlighted document')}
                          className="flex items-center gap-1"
                        >
                          <Copy size={14} />
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Citation Statistics */}
                  {stats && (
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{stats.total} total</Badge>
                      {stats.correct > 0 && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          {stats.correct} correct
                        </Badge>
                      )}
                      {stats.uncertain > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          {stats.uncertain} uncertain
                        </Badge>
                      )}
                      {stats.errors > 0 && (
                        <Badge variant="destructive">
                          {stats.errors} errors
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    <strong>How to use:</strong> Citations are highlighted in Green (correct), Yellow (uncertain), or Red (errors). 
                    Click on any highlighted citation to see detailed analysis and suggested corrections.
                  </div>
                </div>
                
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {currentResult && currentResult.citations.length > 0 ? (
                        <CitationHighlighter
                          content={previewAnchoredText}
                          citations={currentResult.citations}
                          onCitationClick={handleCitationClick}
                        />
                      ) : currentResult && currentResult.citations.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <Search size={48} className="mx-auto mb-4 text-gray-400" />
                          <p>No citations found in this document</p>
                          <p className="text-xs mt-2">The document appears to contain no legal citations</p>
                        </div>
                      ) : !currentResult && isProcessing ? (
                        <div className="text-center text-blue-500 py-8">
                          <Search size={48} className="mx-auto mb-4 text-blue-400 animate-pulse" />
                          <p>Analyzing citations...</p>
                          <p className="text-xs mt-2">GPT-4.1 is examining the document for legal citations</p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
                          <p>Citation analysis not yet performed</p>
                          <p className="text-xs mt-2">Click "Extract Citations" to analyze this document</p>
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

      {/* Citation Detail Modal */}
      <CitationDetailModal
        isOpen={isCitationDetailOpen}
        onClose={() => setIsCitationDetailOpen(false)}
        citation={selectedCitation}
      />
    </Dialog>
  );
};

export default DocumentPreviewModal;
