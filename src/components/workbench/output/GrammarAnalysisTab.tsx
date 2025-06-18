
import React from 'react';
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRedlineDataTransform } from "@/hooks/redlining/useRedlineDataTransform";
import AnalysisContent from "./AnalysisContent";
import AnalysisErrorState from "./AnalysisErrorState";

interface GrammarAnalysisTabProps {
  result: any;
}

const GrammarAnalysisTab: React.FC<GrammarAnalysisTabProps> = ({ result }) => {
  const { validateAnalysisData } = useRedlineDataTransform();

  console.log('GrammarAnalysisTab received result:', result);

  const hasValidAnalysis = validateAnalysisData(result);
  const analysisData = result?.output?.analysis || [];

  // Render main analysis view (redlining functionality moved to WorkspaceSidebar)
  return (
    <ErrorBoundary>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Grammar Analysis</h3>
          <p className="text-gray-600">Review suggestions and corrections for your document</p>
          <p className="text-sm text-blue-600 mt-2">
            💡 Use the Redline tab in the sidebar for interactive editing
          </p>
        </div>

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
