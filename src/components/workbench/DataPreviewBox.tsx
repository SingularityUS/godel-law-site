
/**
 * DataPreviewBox Component
 * 
 * Purpose: Displays data flowing through connections in a compact preview box
 * This component shows input/output data for edge connections with toggle
 * functionality and proper formatting for different data types.
 */

import React, { useState } from "react";
import { Eye, Copy, ChevronDown, ChevronUp, X, Maximize2 } from "lucide-react";
import FullJsonViewer from "./FullJsonViewer";

interface DataPreviewBoxProps {
  edgeData: {
    inputData: any;
    outputData: any;
    dataType: 'text' | 'json' | 'binary' | 'error';
    isProcessing: boolean;
  };
  onSimulateProcessing?: () => void;
  onClose?: () => void;
}

const DataPreviewBox: React.FC<DataPreviewBoxProps> = ({ 
  edgeData, 
  onSimulateProcessing,
  onClose 
}) => {
  const [viewMode, setViewMode] = useState<'input' | 'output'>('output');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullViewer, setShowFullViewer] = useState(false);

  const currentData = viewMode === 'input' ? edgeData.inputData : edgeData.outputData;

  const formatData = (data: any) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const truncateData = (data: string, maxLength = 100) => {
    if (data.length <= maxLength) return data;
    return data.substring(0, maxLength) + '...';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatData(currentData));
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSimulateProcessing) {
      onSimulateProcessing();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  const handleViewFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullViewer(true);
  };

  return (
    <>
      <div 
        className="data-preview-box bg-white border-2 border-black p-2 text-xs min-w-32 max-w-48 cursor-pointer hover:shadow-lg transition-shadow relative"
        style={{ fontFamily: 'Courier New, monospace' }}
        onClick={handlePreviewClick}
      >
        {/* Close button in upper right corner */}
        <button
          onClick={handleClose}
          className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 z-10"
          title="Close preview"
        >
          <X size={8} />
        </button>

        {/* Header with controls */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('output');
              }}
              className={`px-1 py-0.5 text-xs border ${
                viewMode === 'output' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
            >
              OUT
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('input');
              }}
              className={`px-1 py-0.5 text-xs border ${
                viewMode === 'input' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
            >
              IN
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={handleViewFull}
              className="p-0.5 hover:bg-gray-100"
              title="View full JSON"
            >
              <Maximize2 size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              className="p-0.5 hover:bg-gray-100"
              title="Copy data"
            >
              <Copy size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-gray-100"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          </div>
        </div>

        {/* Processing indicator */}
        {edgeData.isProcessing && (
          <div className="text-center text-gray-600 mb-2">
            <span className="animate-pulse">Processing...</span>
          </div>
        )}

        {/* Data type indicator */}
        <div className="flex items-center gap-1 mb-1">
          <Eye size={8} />
          <span className="text-gray-600 uppercase">{edgeData.dataType}</span>
          <span className="text-gray-500 text-xs">
            ({new Blob([formatData(currentData)]).size}b)
          </span>
        </div>

        {/* Data content */}
        <div className={`bg-gray-50 border border-gray-300 p-1 ${
          isExpanded ? 'max-h-40 overflow-y-auto' : 'max-h-16 overflow-hidden'
        }`}>
          <pre className="whitespace-pre-wrap text-xs leading-tight">
            {isExpanded 
              ? formatData(currentData)
              : truncateData(formatData(currentData))
            }
          </pre>
        </div>

        {/* Flow direction indicator */}
        <div className="text-center mt-1 text-gray-500">
          <span className="text-xs">→</span>
        </div>
      </div>

      {/* Full JSON Viewer Modal */}
      <FullJsonViewer
        data={edgeData}
        isOpen={showFullViewer}
        onClose={() => setShowFullViewer(false)}
      />
    </>
  );
};

export default DataPreviewBox;
