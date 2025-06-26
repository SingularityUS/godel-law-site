
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scale, Play, RotateCcw, FileText, AlertCircle } from "lucide-react";
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
    processCitations, 
    clearResults 
  } = useCitationAnalysis();

  const handleProcessCitations = async () => {
    // Extract document text with anchor tags
    let documentText = "";
    
    if (output?.nodes) {
      const document = extractDocumentFromNodes(output.nodes);
      if (document?.content) {
        documentText = document.content;
      }
    }
    
    // Fallback to preview document content
    if (!documentText && previewDocument?.preview) {
      documentText = previewDocument.preview;
    }

    if (!documentText) {
      console.error('No document text available for citation analysis');
      return;
    }

    console.log('Processing citations for document text:', documentText.substring(0, 200) + '...');
    await processCitations(documentText);
  };

  const hasDocument = (output?.nodes && extractDocumentFromNodes(output.nodes)) || previewDocument;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={20} className="text-blue-600" />
          <h3 className="font-semibold text-lg text-gray-800">Citation Raw Data</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Analyze legal citations in the document using GPT-4.1 and The Bluebook standards
        </p>
        
        <div className="flex gap-2">
          <Button
            onClick={handleProcessCitations}
            disabled={isProcessing || !hasDocument}
            className="flex items-center gap-2"
          >
            <Play size={16} />
            {isProcessing ? 'Processing...' : 'Analyze Citations'}
          </Button>
          
          {citationResults && (
            <Button
              onClick={clearResults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Clear Results
            </Button>
          )}
        </div>
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
                <p className="text-xs mt-1">Click "Analyze Citations" to process the document</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Analyzing citations with GPT-4.1...</p>
                <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
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
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="p-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">Raw JSON Response</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Found {Array.isArray(citationResults) ? citationResults.length : 0} citations
                    </p>
                  </div>
                  <div className="p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(citationResults, null, 2)}
                    </pre>
                  </div>
                </div>

                {Array.isArray(citationResults) && citationResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Citation Summary</h4>
                    {citationResults.map((citation, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {citation.type || 'unknown'}
                          </span>
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
                              <span className="font-medium text-gray-700">Suggested:</span> {citation.suggested}
                            </p>
                          )}
                          {citation.errors && citation.errors.length > 0 && (
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Errors:</span> {citation.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CitationRawDataTab;
