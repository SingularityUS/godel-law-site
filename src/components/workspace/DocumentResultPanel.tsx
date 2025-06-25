
import React, { useState } from "react";
import { Download, FileText, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface DocumentResultPanelProps {
  documentResult?: DocumentResult | null;
  onDownloadRedlined?: () => void;
}

const DocumentResultPanel: React.FC<DocumentResultPanelProps> = ({
  documentResult,
  onDownloadRedlined
}) => {
  const [showRedlines, setShowRedlines] = useState(true);

  if (!documentResult) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div className="text-gray-500">
          <FileText size={64} className="mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium mb-2">No Document Processed</h4>
          <p className="text-sm">Upload a document and process citations to see results here</p>
        </div>
      </div>
    );
  }

  const { originalDocument, redlinedDocument, citations, processedAt } = documentResult;

  // Create a display version of the content with citations highlighted
  const renderContentWithHighlights = (content: string, showChanges: boolean) => {
    if (!showChanges || citations.length === 0) {
      return <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>;
    }

    // Sort citations by offset for proper rendering
    const sortedCitations = [...citations].sort((a, b) => a.start_offset - b.start_offset);
    
    let renderedContent = [];
    let lastOffset = 0;

    sortedCitations.forEach((citation, index) => {
      // Add content before this citation
      if (citation.start_offset > lastOffset) {
        renderedContent.push(
          <span key={`text-${index}`}>
            {content.slice(lastOffset, citation.start_offset)}
          </span>
        );
      }

      // Add the citation with highlight
      renderedContent.push(
        <span 
          key={`citation-${index}`}
          className="bg-red-100 text-red-800 relative group cursor-help"
          title={`Original: ${citation.original}\nSuggested: ${citation.suggested}${citation.explanation ? `\nReason: ${citation.explanation}` : ''}`}
        >
          <span className="line-through">{citation.original}</span>
          <span className="text-green-700 bg-green-100 ml-1 px-1 rounded">
            {citation.suggested}
          </span>
        </span>
      );

      lastOffset = citation.end_offset;
    });

    // Add remaining content
    if (lastOffset < content.length) {
      renderedContent.push(
        <span key="text-final">
          {content.slice(lastOffset)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap text-sm leading-relaxed">{renderedContent}</div>;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">{originalDocument.name}</h4>
            <p className="text-xs text-gray-600">
              Processed {processedAt.toLocaleString()} • {citations.length} citation{citations.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRedlines(!showRedlines)}
              className="h-8 px-3 text-xs"
            >
              {showRedlines ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRedlines ? 'Hide' : 'Show'} Changes
            </Button>
            {redlinedDocument.downloadUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={onDownloadRedlined}
                className="h-8 px-3 text-xs"
              >
                <Download size={14} className="mr-1" />
                Download DOCX
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 text-xs">
          {citations.length > 0 ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle size={12} />
              {citations.length} Citation{citations.length !== 1 ? 's' : ''} Corrected
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle size={12} />
              No Issues Found
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {citations.length > 0 ? (
          <div className="h-full flex">
            {/* Document Content - 70% */}
            <div className="flex-1 min-w-0 border-r">
              <div className="p-4 border-b bg-gray-50">
                <h5 className="font-medium text-sm">
                  {showRedlines ? 'Document with Tracked Changes' : 'Original Document'}
                </h5>
              </div>
              <ScrollArea className="h-full">
                <div className="p-4">
                  {renderContentWithHighlights(originalDocument.content, showRedlines)}
                </div>
              </ScrollArea>
            </div>

            {/* Citations List - 30% */}
            <div className="w-80 flex-shrink-0">
              <div className="p-4 border-b bg-gray-50">
                <h5 className="font-medium text-sm">Citation Corrections</h5>
              </div>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {citations.map((citation, index) => (
                    <Card key={index} className="text-xs">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-500" />
                          Citation {index + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div>
                          <div className="font-medium text-red-700 mb-1">Original:</div>
                          <div className="bg-red-50 p-2 rounded text-red-800 font-mono">
                            {citation.original}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700 mb-1">Suggested:</div>
                          <div className="bg-green-50 p-2 rounded text-green-800 font-mono">
                            {citation.suggested}
                          </div>
                        </div>
                        {citation.explanation && (
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Reason:</div>
                            <div className="text-gray-600">
                              {citation.explanation}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="p-4 border-b bg-gray-50">
              <h5 className="font-medium text-sm">Original Document</h5>
            </div>
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {originalDocument.content}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentResultPanel;
