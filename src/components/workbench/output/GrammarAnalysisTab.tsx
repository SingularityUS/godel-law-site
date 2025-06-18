
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

  const handleOpenRedlining = useCallback(() => {
    try {
      console.log('Opening redlining mode with result:', result);
      
      if (!result?.output?.analysis) {
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
        preview: result.metadata?.originalPreview // This should contain the original file URL/blob
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
    if (!result?.output?.analysis) {
      return <div className="p-4">No grammar analysis available.</div>;
    }

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Grammar Analysis</h3>
        <ul>
          {result.output.analysis.map((paragraph: any, paragraphIndex: number) => (
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
        <button onClick={handleOpenRedlining} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Open Redlining
        </button>
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
