
import React from 'react';

interface AnalysisErrorStateProps {
  result?: any;
  showDebugInfo?: boolean;
}

const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({ 
  result, 
  showDebugInfo = false 
}) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 font-medium mb-3">
        📄 No grammar analysis available
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        The grammar analysis results could not be found or processed. This might be because:
      </div>
      
      <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4">
        <li>• The analysis hasn't completed yet</li>
        <li>• No issues were found in the document</li>
        <li>• There was an error during processing</li>
      </ul>
      
      {showDebugInfo && result && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Show Debug Information
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default AnalysisErrorState;
