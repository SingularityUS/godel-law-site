
import React, { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { RedlineDocument } from "@/types/redlining";
import { RedlineDocumentViewer } from "@/components/redlining";
import { useRedlineDataTransform } from "@/hooks/redlining/useRedlineDataTransform";
import RedlineControls from "./RedlineControls";
import AnalysisContent from "./AnalysisContent";
import AnalysisErrorState from "./AnalysisErrorState";

interface GrammarAnalysisTabProps {
  result: any;
}

const GrammarAnalysisTab: React.FC<GrammarAnalysisTabProps> = ({ result }) => {
  const [isRedlining, setIsRedlining] = useState(false);
  const [redlineDocument, setRedlineDocument] = useState<RedlineDocument | null>(null);
  const { transformGrammarData, validateAnalysisData } = useRedlineDataTransform();

  console.log('GrammarAnalysisTab received result:', result);

  const hasValidAnalysis = validateAnalysisData(result);
  const analysisData = result?.output?.analysis || [];

  const handleOpenRedlining = useCallback(() => {
    try {
      console.log('Opening redlining mode with result:', result);
      
      const convertedDocument = transformGrammarData(result);
      
      if (!convertedDocument) {
        toast({
          title: "Error",
          description: "No analysis data available for redlining",
          variant: "destructive"
        });
        return;
      }

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
  }, [result, transformGrammarData]);

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

  // Render redlining view
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

  // Render main analysis view
  return (
    <ErrorBoundary>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Grammar Analysis</h3>
          <p className="text-gray-600">Review suggestions and corrections for your document</p>
        </div>

        <RedlineControls
          hasValidData={hasValidAnalysis}
          onOpenRedlining={handleOpenRedlining}
        />

        {hasValidAnalysis ? (
          <AnalysisContent analysisData={analysisData} />
        ) : (
          <AnalysisErrorState result={result} showDebugInfo={true} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GrammarAnalysisTab;
