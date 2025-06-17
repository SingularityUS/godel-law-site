
/**
 * GrammarAnalysisTab Component
 * 
 * Purpose: Displays grammar analysis results with detailed paragraph breakdown
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Info } from "lucide-react";

interface GrammarAnalysisTabProps {
  output: any;
}

const GrammarAnalysisTab: React.FC<GrammarAnalysisTabProps> = ({ output }) => {
  const grammarResult = output.results?.find((r: any) => r.moduleType === 'grammar-checker');
  
  if (!grammarResult) {
    return <div>No grammar analysis available</div>;
  }

  const grammarData = grammarResult.result?.output;
  if (!grammarData || !grammarData.analysis) {
    return <div>Grammar analysis format not recognized</div>;
  }

  return (
    <div className="space-y-4 h-full overflow-auto">
      <div className="p-4 border rounded bg-blue-50">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Scale size={18} />
          Grammar Analysis Summary
        </h3>
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
