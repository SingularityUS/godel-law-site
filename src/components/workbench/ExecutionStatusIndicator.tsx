
import React from "react";
import { CheckCircle, Clock, AlertCircle, Play, Hash, FileText } from "lucide-react";

interface ExecutionStatusIndicatorProps {
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  className?: string;
  debugInfo?: {
    totalChunks?: number;
    totalParagraphs?: number;
    processed?: number;
    total?: number;
    progress?: string;
  };
}

const ExecutionStatusIndicator: React.FC<ExecutionStatusIndicatorProps> = ({
  status,
  error,
  className = "",
  debugInfo
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: null,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          title: 'Ready'
        };
      case 'queued':
        return {
          icon: <Clock size={12} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          title: 'Queued'
        };
      case 'processing':
        return {
          icon: <Play size={12} className="animate-pulse" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          title: 'Processing'
        };
      case 'completed':
        return {
          icon: <CheckCircle size={12} />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          title: 'Completed'
        };
      case 'error':
        return {
          icon: <AlertCircle size={12} />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          title: error || 'Error'
        };
      default:
        return {
          icon: null,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          title: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle') {
    return null; // Don't show indicator for idle state
  }

  // Build debug tooltip content
  let tooltipContent = config.title;
  if (debugInfo) {
    const debugParts = [];
    if (debugInfo.totalChunks) debugParts.push(`${debugInfo.totalChunks} chunks`);
    if (debugInfo.totalParagraphs) debugParts.push(`${debugInfo.totalParagraphs} paragraphs`);
    if (debugInfo.progress) debugParts.push(`Progress: ${debugInfo.progress}`);
    if (debugInfo.processed !== undefined && debugInfo.total !== undefined) {
      debugParts.push(`${debugInfo.processed}/${debugInfo.total} processed`);
    }
    
    if (debugParts.length > 0) {
      tooltipContent += ` - ${debugParts.join(', ')}`;
    }
  }

  return (
    <div className="absolute -top-2 -left-2 flex flex-col items-center">
      {/* Main status indicator */}
      <div 
        className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${config.bgColor} ${config.color} ${className}`}
        title={tooltipContent}
      >
        {config.icon}
      </div>
      
      {/* Debug info display */}
      {debugInfo && (status === 'processing' || status === 'completed') && (
        <div className="mt-1 text-xs bg-white border rounded px-1 py-0.5 shadow-sm min-w-max">
          {debugInfo.totalChunks && (
            <div className="flex items-center gap-1 text-blue-600">
              <Hash size={8} />
              <span>{debugInfo.totalChunks}c</span>
            </div>
          )}
          {debugInfo.totalParagraphs && (
            <div className="flex items-center gap-1 text-purple-600">
              <FileText size={8} />
              <span>{debugInfo.totalParagraphs}p</span>
            </div>
          )}
          {debugInfo.progress && (
            <div className="text-gray-600">
              {debugInfo.progress}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionStatusIndicator;
