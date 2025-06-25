import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Anchor } from "lucide-react";

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

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            {document.name}
            {anchorCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Anchor size={12} />
                {anchorCount} anchors
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
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
              </TabsList>
            </div>

            {/* Original Document Tab */}
            <TabsContent value="original" className="flex-1 min-h-0 m-0 p-6">
              <div className="h-full border rounded-lg bg-white">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-medium text-sm">Original Document Content</h4>
                  <p className="text-xs text-gray-600">
                    {document.extractedText?.length || 0} characters extracted from {document.type}
                  </p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {document.extractedText ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
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
            </TabsContent>

            {/* Anchored Document Tab */}
            <TabsContent value="anchored" className="flex-1 min-h-0 m-0 p-6">
              <div className="h-full border rounded-lg bg-white">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-medium text-sm">Document with Anchor Tokens</h4>
                  <p className="text-xs text-gray-600">
                    {previewAnchoredText.length} characters with {anchorCount} anchor tokens (⟦P-#####⟧)
                  </p>
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Note:</strong> Anchor tokens (⟦P-#####⟧) mark paragraph positions for citation processing. 
                    These invisible markers help maintain accurate positions when generating redlined documents.
                  </div>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {previewAnchoredText ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                        {/* Highlight anchor tokens for visibility */}
                        {previewAnchoredText.split(/(⟦P-\d{5}⟧)/).map((part, index) => {
                          if (part.match(/⟦P-\d{5}⟧/)) {
                            return (
                              <span 
                                key={index} 
                                className="bg-yellow-200 text-yellow-800 px-1 rounded text-xs font-bold"
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
