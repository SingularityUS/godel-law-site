import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scale, Play, RotateCcw, FileText, AlertCircle, Settings, CheckCircle } from "lucide-react";
import { useCitationAnalysis } from "@/hooks/workbench/useCitationAnalysis";
import { useDocumentContext } from "@/hooks/workbench/useDocumentContext";

interface CitationRawDataTabProps {
  output: any;
  previewDocument: { name: string; type: string; preview?: string } | null;
}

const CitationRawDataTab: React.FC<CitationRawDataTabProps> = ({
  output,
  previewDocument
}) => {
  const { extractDocumentFromNodes } = useDocumentContext();
  const { 
    isProcessing, 
    citationResults, 
    error, 
    autoProcessEnabled,
    processCitations, 
    autoProcessDocument,
    clearResults,
    toggleAutoProcess
  } = useCitationAnalysis();

  const [documentInfo, setDocumentInfo] = useState<{
    text: string;
    hasAnchors: boolean;
    anchorCount: number;
    name: string;
  } | null>(null);

  // Extract document information when output changes
  useEffect(() => {
    let documentText = "";
    let hasAnchors = false;
    let anchorCount = 0;
    let documentName = "Unknown Document";
    
    if (output?.nodes) {
      const document = extractDocumentFromNodes(output.nodes);
      if (document?.content) {
        documentText = document.content;
        hasAnchors = document.hasAnchorTags || false;
        anchorCount = documentText.match(/⟦P-\d{5}⟧/g)?.length || 0;
        // Ensure documentName is always a string
        documentName = typeof document.name === 'string' ? document.name : "Unknown Document";
        console.log('Extracted document from nodes:', {
          name: documentName,
          hasAnchors,
          anchorCount,
          textLength: documentText.length
        });
      }
    }
    
    // Fallback to preview document content
    if (!documentText && previewDocument?.preview) {
      documentText = previewDocument.preview;
      anchorCount = documentText.match(/⟦P-\d{5}⟧/g)?.length || 0;
      hasAnchors = anchorCount > 0;
      documentName = previewDocument.name;
    }

    const newDocumentInfo = {
      text: documentText,
      hasAnchors,
      anchorCount,
      name: documentName
    };

    setDocumentInfo(newDocumentInfo);

    // Auto-process if enabled and document has anchor tags
    if (autoProcessEnabled && documentText && hasAnchors) {
      console.log('Auto-processing document with', anchorCount, 'anchor tags');
      // documentName is now guaranteed to be a string
      autoProcessDocument(documentText, documentName);
    }
  }, [output, previewDocument, extractDocumentFromNodes, autoProcessEnabled, autoProcessDocument]);

  const handleProcessCitations = async () => {
    if (!documentInfo?.text) {
      console.error('No document text available for citation analysis');
      return;
    }

    console.log('Manually processing citations for document:', documentInfo.name);
    // Pass documentInfo.name as string
    await processCitations(documentInfo.text, documentInfo.name);
  };

  const hasDocument = documentInfo?.text;
  const hasAnchorTags = documentInfo?.hasAnchors;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={20} className="text-blue-600" />
          <h3 className="font-semibold text-lg text-gray-800">Citation Analysis</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Analyze legal citations using GPT-4.1 and The Bluebook standards
        </p>

        {/* Document Status */}
        {documentInfo && (
          <div className="mb-3 p-2 bg-gray-50 rounded border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Document: {documentInfo.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-600">
                    {documentInfo.text.length.toLocaleString()} characters
                  </span>
                  {hasAnchorTags ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {documentInfo.anchorCount} anchors
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600">No anchor tags</span>
                  )}
                </div>
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
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={handleProcessCitations}
            disabled={isProcessing || !hasDocument}
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

        {!hasAnchorTags && hasDocument && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            ⚠️ Document lacks anchor tags (⟦P-#####⟧) needed for precise citation analysis
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {!hasDocument && (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-sm">No document available for citation analysis</p>
                <p className="text-xs mt-1">Please select a document in the workspace</p>
              </div>
            )}

            {hasDocument && !citationResults && !error && !isProcessing && (
              <div className="text-center py-8 text-gray-500">
                <Scale size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-sm">Ready to analyze legal citations</p>
                <p className="text-xs mt-1">
                  {autoProcessEnabled && hasAnchorTags
                    ? "Auto-processing will start when anchor tags are detected"
                    : "Click 'Analyze Citations' to process the document"
                  }
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Analyzing citations with GPT-4.1...</p>
                <p className="text-xs text-gray-500 mt-1">Processing {documentInfo?.anchorCount || 0} anchor points</p>
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
  );
};

export default CitationRawDataTab;
