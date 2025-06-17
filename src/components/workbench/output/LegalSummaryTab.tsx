
/**
 * LegalSummaryTab Component
 * 
 * Purpose: Displays legal document processing summary
 */

import React from "react";
import { Scale, FileText } from "lucide-react";

interface LegalSummaryTabProps {
  output: any;
}

const LegalSummaryTab: React.FC<LegalSummaryTabProps> = ({ output }) => {
  if (!output.summary || !output.results) {
    return <div>No legal analysis results available</div>;
  }

  return (
    <div className="space-y-4 h-full overflow-auto">
      <div className="p-4 border rounded bg-slate-50">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <Scale size={18} />
          Legal Document Processing Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Documents Processed:</strong> {output.summary?.documentsProcessed || 0}
          </div>
          <div>
            <strong>Modules Executed:</strong> {output.summary?.modulesExecuted || 0}
          </div>
          <div>
            <strong>Processing Completed:</strong> {new Date(output.summary?.processingCompleted).toLocaleString()}
          </div>
          <div>
            <strong>Pipeline Type:</strong> {output.summary?.pipelineType}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Processing Steps:</h4>
        {output.results?.map((result: any, index: number) => (
          <div key={index} className="p-3 border rounded bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} />
              <strong className="capitalize">{result.moduleType?.replace('-', ' ')}</strong>
            </div>
            <div className="text-sm text-gray-600">
              {result.moduleType === 'document-input' 
                ? `Loaded: ${result.result?.title}`
                : `Processed with ${result.result?.metadata?.model || 'AI'}`
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalSummaryTab;
