
import React from 'react';

interface AnalysisItem {
  originalContent?: string;
  original?: string;
  legalWritingScore?: number;
  improvementSummary?: string;
  suggestions?: Array<{
    issue?: string;
    originalText?: string;
    suggestion?: string;
    suggestedText?: string;
    description?: string;
    explanation?: string;
  }>;
}

interface AnalysisContentProps {
  analysisData: AnalysisItem[];
}

const AnalysisContent: React.FC<AnalysisContentProps> = ({ analysisData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600 font-medium">
          Found {analysisData.length} paragraph(s) with analysis
        </p>
      </div>
      
      {analysisData.map((paragraph, paragraphIndex) => (
        <div key={paragraphIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="mb-3">
            <h4 className="font-semibold text-lg text-gray-800">
              Paragraph {paragraphIndex + 1}
            </h4>
            <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded border-l-4 border-gray-300">
              <span className="font-medium">Original:</span> {paragraph.originalContent || paragraph.original}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
              <p className="text-sm font-medium text-green-800">
                Legal Writing Score: {paragraph.legalWritingScore || 'N/A'}/10
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              <p className="text-sm font-medium text-blue-800">
                Summary: {paragraph.improvementSummary || 'No summary available'}
              </p>
            </div>
          </div>
          
          {paragraph.suggestions && paragraph.suggestions.length > 0 ? (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Suggestions:</h5>
              {paragraph.suggestions.map((suggestion, suggestionIndex) => (
                <div key={suggestionIndex} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold text-red-600">Issue:</span> {suggestion.issue || suggestion.originalText}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-green-600">Suggestion:</span> {suggestion.suggestion || suggestion.suggestedText}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Description:</span> {suggestion.description || suggestion.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-green-700 text-sm font-medium">✓ No issues found in this paragraph.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnalysisContent;
