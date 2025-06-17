
/**
 * ResultsPanel Component
 * 
 * Purpose: Display final workflow execution results
 * Shows structured data with export functionality
 */

import React, { useState } from "react";
import { X, Download, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsPanelProps {
  finalResult: any;
  executionResults: Record<string, any>;
  onClose: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  finalResult,
  executionResults,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    final: true,
    steps: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatResult = (data: any) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadResults = () => {
    const results = {
      finalResult,
      executionSteps: executionResults,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-white border-l-2 border-black flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-black p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Workflow Results</h2>
        <div className="flex gap-2">
          <Button
            onClick={downloadResults}
            variant="outline"
            size="sm"
            title="Download results as JSON"
          >
            <Download size={16} />
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            title="Close results panel"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Final Result */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('final')}
            className="w-full p-3 flex items-center justify-between bg-green-50 rounded-t-lg hover:bg-green-100 transition-colors"
          >
            <h3 className="font-semibold text-green-800">Final Output</h3>
            {expandedSections.final ? (
              <ChevronDown size={16} className="text-green-600" />
            ) : (
              <ChevronRight size={16} className="text-green-600" />
            )}
          </button>
          
          {expandedSections.final && (
            <div className="p-3 border-t">
              <div className="bg-gray-50 rounded p-3 font-mono text-sm whitespace-pre-wrap relative group">
                {formatResult(finalResult)}
                <Button
                  onClick={() => copyToClipboard(formatResult(finalResult))}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy to clipboard"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Execution Steps */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('steps')}
            className="w-full p-3 flex items-center justify-between bg-blue-50 rounded-t-lg hover:bg-blue-100 transition-colors"
          >
            <h3 className="font-semibold text-blue-800">
              Execution Steps ({Object.keys(executionResults).length})
            </h3>
            {expandedSections.steps ? (
              <ChevronDown size={16} className="text-blue-600" />
            ) : (
              <ChevronRight size={16} className="text-blue-600" />
            )}
          </button>
          
          {expandedSections.steps && (
            <div className="border-t">
              {Object.entries(executionResults).map(([nodeId, result], index) => (
                <div key={nodeId} className="p-3 border-b last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">
                      Step {index + 1}: {nodeId}
                    </span>
                    <Button
                      onClick={() => copyToClipboard(formatResult(result))}
                      variant="ghost"
                      size="sm"
                      title="Copy step result"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded p-2 font-mono text-xs whitespace-pre-wrap max-h-32 overflow-auto">
                    {formatResult(result)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Execution completed at: {new Date().toLocaleString()}</div>
          <div>Total steps: {Object.keys(executionResults).length}</div>
          <div>Final result type: {typeof finalResult}</div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
