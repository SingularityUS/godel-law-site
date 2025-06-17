
/**
 * GrammarAnalysisTab Component
 * 
 * Purpose: Displays grammar analysis results with detailed paragraph breakdown
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Info, AlertTriangle } from "lucide-react";

interface GrammarAnalysisTabProps {
  output: any;
}

const GrammarAnalysisTab: React.FC<GrammarAnalysisTabProps> = ({ output }) => {
  // Look for grammar analysis in the results array or final output
  let grammarResult = null;
  
  if (output.results) {
    grammarResult = output.results.find((r: any) => r.moduleType === 'grammar-checker');
  } else if (output.moduleType === 'grammar-checker') {
    grammarResult = { result: output };
  } else if (output.finalOutput && output.finalOutput.moduleType === 'grammar-checker') {
    grammarResult = { result: output.finalOutput };
  }
  
  if (!grammarResult) {
    return (
      <div className="p-4 text-center">
        <AlertTriangle className="mx-auto mb-2 text-yellow-500" size={24} />
        <p>No grammar analysis available</p>
      </div>
    );
  }

  const grammarData = grammarResult.result?.output;
  
  // Handle error cases
  if (!grammarData) {
    return (
      <div className="p-4 text-center">
        <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} />
        <p>Grammar analysis data not found</p>
      </div>
    );
  }

  if (grammarData.error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="font-bold text-red-700 mb-2">Grammar Analysis Error</h3>
          <p className="text-red-600">{grammarData.error}</p>
          {grammarData.rawResponse && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-500">View Raw Response</summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                {typeof grammarData.rawResponse === 'string' ? 
                  grammarData.rawResponse : 
                  JSON.stringify(grammarData.rawResponse, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (!grammarData.analysis || !Array.isArray(grammarData.analysis)) {
    return (
      <div className="p-4 text-center">
        <AlertTriangle className="mx-auto mb-2 text-yellow-500" size={24} />
        <p>Grammar analysis format not recognized</p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-500">View Data Structure</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(grammarData, null, 2)}
          </pre>
        </details>
      </div>
    );
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
        
        {/* Show processing statistics if available */}
        {grammarData.processingStats && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2 text-sm">
              <Info size={16} />
              <strong>Processing Statistics:</strong>
            </div>
            <div className="text-xs mt-1 space-y-1">
              <div>Total suggestions: {grammarData.processingStats.totalSuggestions || 0}</div>
              <div>Average improvements per paragraph: {grammarData.processingStats.averageImprovementsPerParagraph || 0}</div>
              {grammarData.processingStats.averageWordCount && (
                <div>Average word count: {grammarData.processingStats.averageWordCount}</div>
              )}
            </div>
          </div>
        )}

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
        <Card key={paragraph.paragraphId || index}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Paragraph {paragraph.paragraphId || `${index + 1}`}</span>
              <div className="flex gap-2">
                {paragraph.chunkInfo && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Chunk {paragraph.chunkInfo.chunkIndex + 1}/{paragraph.chunkInfo.totalChunks}
                  </span>
                )}
                {paragraph.legalWritingScore && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    paragraph.legalWritingScore >= 8 ? 'bg-green-100 text-green-700' :
                    paragraph.legalWritingScore >= 6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Score: {paragraph.legalWritingScore}/10
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong className="text-sm">Original:</strong>
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                {paragraph.original || 'No original text available'}
              </div>
            </div>
            
            {paragraph.suggestions?.length > 0 && (
              <div>
                <strong className="text-sm">Suggestions ({paragraph.suggestions.length}):</strong>
                <div className="mt-1 space-y-1">
                  {paragraph.suggestions.map((suggestion: any, sIndex: number) => (
                    <div key={sIndex} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <div className="font-medium flex items-center justify-between">
                        <span>{suggestion.issue || 'Grammar/Style'}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          suggestion.severity === 'major' ? 'bg-red-100 text-red-700' :
                          suggestion.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {suggestion.severity || 'moderate'}
                        </span>
                      </div>
                      <div className="mt-1">{suggestion.description}</div>
                      <div className="italic mt-1 text-gray-600">
                        Suggestion: {suggestion.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <strong className="text-sm">Corrected:</strong>
              <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                {paragraph.corrected || paragraph.original || 'No corrected text available'}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>
                {paragraph.improvementSummary || 
                 (paragraph.suggestions?.length > 0 ? 
                   `${paragraph.suggestions.length} improvement${paragraph.suggestions.length !== 1 ? 's' : ''} identified` : 
                   'No improvements needed')}
              </span>
              {paragraph.wordCount && (
                <span>Words: {paragraph.wordCount}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {(!grammarData.analysis || grammarData.analysis.length === 0) && (
        <div className="p-4 text-center text-gray-500">
          <Info className="mx-auto mb-2" size={24} />
          <p>No paragraphs were analyzed</p>
        </div>
      )}
    </div>
  );
};

export default GrammarAnalysisTab;
