
import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface CitationFinderWarningProps {
  error: string;
  className?: string;
}

const CitationFinderWarning: React.FC<CitationFinderWarningProps> = ({ 
  error, 
  className = "" 
}) => {
  if (!error.includes("No paragraph data available")) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Citation Finder Needs Paragraph Data
          </h3>
          <p className="text-yellow-700 text-sm mb-3">
            The Citation Finder module didn't receive any paragraph data to analyze. 
            This typically happens when it's not properly connected to the pipeline.
          </p>
          <div className="bg-yellow-100 rounded p-3 text-sm text-yellow-800">
            <div className="font-medium mb-2">Recommended Pipeline:</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white px-2 py-1 rounded border">Document Input</span>
              <ArrowRight size={12} />
              <span className="bg-white px-2 py-1 rounded border">Paragraph Splitter</span>
              <ArrowRight size={12} />
              <span className="bg-white px-2 py-1 rounded border">Citation Finder</span>
            </div>
            <p className="mt-2 text-xs">
              Connect the Citation Finder directly to the Paragraph Splitter output.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationFinderWarning;
