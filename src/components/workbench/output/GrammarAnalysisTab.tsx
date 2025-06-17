
/**
 * GrammarAnalysisTab Component
 * 
 * Purpose: Displays grammar analysis results with detailed paragraph breakdown
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Info, Edit } from "lucide-react";
import RedlineDocumentViewer from "@/components/redlining/RedlineDocumentViewer";
import { convertGrammarAnalysisToRedline } from "@/utils/redlining/grammarToRedline";
import { RedlineDocument } from "@/types/redlining";

interface GrammarAnalysisTabProps {
  output: any;
}

const GrammarAnalysisTab: React.FC<GrammarAnalysisTabProps> = ({ output }) => {
  const [showRedlining, setShowRedlining] = useState(false);
  const [redlineDocument, setRedlineDocument] = useState<RedlineDocument | null>(null);

  const grammarResult = output.results?.find((r: any) => r.moduleType === 'grammar-checker');
  
  if (!grammarResult) {
    return <div>No grammar analysis available</div>;
  }

  const grammarData = grammarResult.result?.output;
  if (!grammarData || !grammarData.analysis) {
    return <div>Grammar analysis format not recognized</div>;
  }

  const handleOpenRedlining = () => {
    // Get the original document from the pipeline
    const docResult = output.results?.find((r: any) => r.moduleType === 'document-input');
    const originalDocument = {
      name: docResult?.result?.metadata?.fileName || 'Document',
      type: docResult?.result?.metadata?.fileType || 'text/plain',
      content: docResult?.result?.content || ''
    };

    const redlineDoc = convertGrammarAnalysisToRedline(grammarResult.result, originalDocument);
    setRedlineDocument(redlineDoc);
    setShowRedlining(true);
  };

  const handleSaveDocument = (document: RedlineDocument) => {
    console.log('Saving redlined document:', document);
    // TODO: Implement document saving logic
  };

  const handleExportDocument = (document: RedlineDocument, format: string) => {
    console.log('Exporting redlined document:', document, format);
    // TODO: Implement document export logic
  };

  if (showRedlining && redlineDocument) {
    return (
      <RedlineDocumentViewer
        document={redlineDocument}
        onClose={() => setShowRedlining(false)}
        onSave={handleSaveDocument}
        onExport={handleExportDocument}
      />
    );
  }

  // Check if redlining is ready from multiple sources for better compatibility
  const isRedliningReady = grammarResult.result?.metadata?.redliningReady || 
                           grammarData.redliningData?.ready || 
                           grammarData.analysis?.some((para: any) => para.redliningReady) ||
                           true; // Always show for demonstration purposes

  return (
    <div className="space-y-4 h-full overflow-auto">
      <div className="p-4 border rounded bg-blue-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold flex items-center gap-2">
            <Scale size={18} />
            Grammar Analysis Summary
          </h3>
          <Button onClick={handleOpenRedlining} className="bg-blue-600 hover:bg-blue-700">
            <Edit size={16} className="mr-1" />
            Open Redlining Mode
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Total Errors:</strong> {grammarData.overallAssessment?.totalErrors || 0}
          </div>
          <div>
            <strong>Writing Quality:</strong> {grammarData.overallAssessment?.writingQuality || 'Unknown'}
          </div>
          <div>
            <strong>Paragraphs Analyzed:</strong> {grammarData.analysis?.length || 0}
          </div>
        </div>
        
        {/* Show redlining status */}
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Edit size={16} />
            <strong>Redlining Mode Available:</strong> Click "Open Redlining Mode" to review and apply suggestions
          </div>
        </div>
        
        {/* Show chunking information if available */}
        {grammarData.chunkingInfo && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center gap-2 text-sm">
              <Info size={16} />
              <strong>Document Processing Info:</strong>
            </div>
            <div className="text-xs mt-1 space-y-1">
              <div>Document was split into {grammarData.chunkingInfo.totalChunks} chunks for processing</div>
              <div>Total paragraphs found: {grammarData.chunkingInfo.totalParagraphs}</div>
              <div>Reassembled at: {new Date(grammarData.chunkingInfo.reassembledAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {grammarData.analysis?.map((paragraph: any, index: number) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Paragraph {paragraph.paragraphId}</span>
              {paragraph.chunkInfo && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Chunk {paragraph.chunkInfo.chunkIndex + 1}/{paragraph.chunkInfo.totalChunks}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong className="text-sm">Original:</strong>
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                {paragraph.original}
              </div>
            </div>
            
            {paragraph.suggestions?.length > 0 && (
              <div>
                <strong className="text-sm">Suggestions:</strong>
                <div className="mt-1 space-y-1">
                  {paragraph.suggestions.map((suggestion: any, sIndex: number) => (
                    <div key={sIndex} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <div className="font-medium">{suggestion.issue}: {suggestion.severity}</div>
                      <div>{suggestion.description}</div>
                      <div className="italic">Suggestion: {suggestion.suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <strong className="text-sm">Corrected:</strong>
              <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                {paragraph.corrected}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Legal Writing Score: {paragraph.legalWritingScore}/10</span>
              <span>{paragraph.improvementSummary}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GrammarAnalysisTab;
