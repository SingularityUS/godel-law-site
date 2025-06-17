
/**
 * ExecutionDebugIndicator Component
 * 
 * Purpose: Enhanced execution indicator with debug information for development
 */

import React from "react";
import { CheckCircle, Clock, AlertCircle, Play, Info } from "lucide-react";

interface ExecutionDebugIndicatorProps {
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  progress?: string;
  debugInfo?: {
    totalItems?: number;
    processedItems?: number;
    itemType?: string;
    isPassThrough?: boolean;
    isDeprecated?: boolean;
  };
  className?: string;
}

const ExecutionDebugIndicator: React.FC<ExecutionDebugIndicatorProps> = ({
  status,
  error,
  progress,
  debugInfo,
  className = ""
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
          title: progress || 'Processing'
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

  if (status === 'idle' && !debugInfo?.totalItems) {
    return null; // Don't show indicator for idle state without debug info
  }

  const showDebugInfo = debugInfo && (debugInfo.totalItems || debugInfo.isPassThrough || debugInfo.isDeprecated);

  return (
    <div className="absolute -top-8 -left-2 flex flex-col items-start">
      {/* Main status indicator */}
      <div 
        className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${config.bgColor} ${config.color} ${className}`}
        title={config.title}
      >
        {config.icon}
      </div>
      
      {/* Debug information */}
      {showDebugInfo && (
        <div className="mt-1 text-xs bg-black text-white px-2 py-1 rounded max-w-32 text-center">
          {debugInfo.isPassThrough && (
            <div className="text-yellow-300">PASS-THROUGH</div>
          )}
          {debugInfo.isDeprecated && (
            <div className="text-orange-300">DEPRECATED</div>
          )}
          {debugInfo.totalItems && (
            <div>
              {debugInfo.processedItems || 0}/{debugInfo.totalItems} {debugInfo.itemType || 'items'}
            </div>
          )}
          {progress && (
            <div className="text-blue-300">{progress}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionDebugIndicator;
