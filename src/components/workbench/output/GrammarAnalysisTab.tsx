
import React, { useState, useCallback } from 'react';
import { convertGrammarAnalysisToRedline } from "@/utils/redlining/grammarToRedline";
import { RedlineDocument } from "@/types/redlining";
import { RedlineDocumentViewer } from "@/components/redlining";
import { toast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";

interface GrammarAnalysisTabProps {
  result: any;
}

const GrammarAnalysisTab: React.FC<GrammarAnalysisTabProps> = ({ result }) => {
  const [isRedlining, setIsRedlining] = useState(false);
  const [redlineDocument, setRedlineDocument] = useState<RedlineDocument | null>(null);

  console.log('GrammarAnalysisTab received result:', result);

  const handleOpenRedlining = useCallback(() => {
    try {
      console.log('Opening redlining mode with result:', result);
      
      // Check multiple possible data structures
      const hasAnalysis = result?.output?.analysis || 
                         result?.analysis || 
                         result?.hasAnalysis ||
                         (result?.output && Object.keys(result.output).length > 0);

      if (!hasAnalysis) {
        console.warn('No analysis data found in result:', result);
        toast({
          title: "Error",
          description: "No analysis data available for redlining",
          variant: "destructive"
        });
        return;
      }

      // Extract original document information from result metadata
      const originalDocument = {
        name: result.metadata?.fileName || 'Document',
        type: result.metadata?.fileType || 'text/plain',
        content: result.metadata?.originalContent || result.input?.content || '',
        preview: result.metadata?.originalPreview
      };

      const convertedDocument = convertGrammarAnalysisToRedline(result, originalDocument);
      console.log('Converted document for redlining:', convertedDocument);
      
      setRedlineDocument(convertedDocument);
      setIsRedlining(true);
    } catch (error) {
      console.error('Error opening redlining mode:', error);
      toast({
        title: "Error",
        description: "Failed to open redlining mode",
        variant: "destructive"
      });
    }
  }, [result]);

  const handleSaveRedline = useCallback((document: RedlineDocument) => {
    console.log('Saving redline document:', document);
    toast({
      title: "Success",
      description: "Redline document saved successfully"
    });
    setIsRedlining(false);
  }, []);

  const handleExportRedline = useCallback((document: RedlineDocument, format: string) => {
    console.log(`Exporting redline document in ${format} format:`, document);
    toast({
      title: "Success",
      description: `Redline document exported in ${format} format`
    });
  }, []);

  const renderAnalysisContent = () => {
    // Check for analysis data in multiple possible locations
    const analysisData = result?.output?.analysis || result?.analysis;
    const hasAnyAnalysis = analysisData || 
                          result?.hasAnalysis || 
                          result?.output?.hasAnalysis ||
                          (result?.output && Object.keys(result.output).length > 0);

    console.log('Analysis data check:', {
      analysisData,
      hasAnyAnalysis,
      resultOutput: result?.output,
      resultKeys: result ? Object.keys(result) : []
    });

    if (!hasAnyAnalysis) {
      return <div className="p-4">No grammar analysis available.</div>;
    }

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Grammar Analysis</h3>
          <button 
            onClick={handleOpenRedlining} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Open Redlining
          </button>
        </div>

        {analysisData && Array.isArray(analysisData) ? (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Found {analysisData.length} paragraph(s) with analysis
            </p>
            <ul>
              {analysisData.map((paragraph: any, paragraphIndex: number) => (
                <li key={paragraphIndex} className="mb-4">
                  <h4 className="font-medium">Paragraph {paragraphIndex + 1}</h4>
                  {paragraph.suggestions && paragraph.suggestions.length > 0 ? (
                    <ul>
                      {paragraph.suggestions.map((suggestion: any, suggestionIndex: number) => (
                        <li key={suggestionIndex} className="mb-2">
                          <p>
                            <span className="font-semibold">Issue:</span> {suggestion.issue || suggestion.originalText}
                          </p>
                          <p>
                            <span className="font-semibold">Suggestion:</span> {suggestion.suggestion || suggestion.suggestedText}
                          </p>
                          <p>
                            <span className="font-semibold">Description:</span> {suggestion.description || suggestion.explanation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No issues found in this paragraph.</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Analysis completed. Results available for redlining.
            </p>
            {result?.hasAnalysis && (
              <p className="text-sm text-green-600">
                Found {result.hasAnalysis} analysis items
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isRedlining && redlineDocument) {
    return (
      <ErrorBoundary>
        <RedlineDocumentViewer
          document={redlineDocument}
          originalDocument={{
            type: result.metadata?.fileType || 'text/plain',
            preview: result.metadata?.originalPreview,
            name: result.metadata?.fileName || 'Document'
          }}
          onClose={() => setIsRedlining(false)}
          onSave={handleSaveRedline}
          onExport={handleExportRedline}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {renderAnalysisContent()}
    </ErrorBoundary>
  );
};

export default GrammarAnalysisTab;
