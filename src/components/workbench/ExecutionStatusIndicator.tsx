
/**
 * ExecutionStatusIndicator Component
 * 
 * Purpose: Visual indicator for node execution status
 * This component shows the current state of each node during pipeline execution.
 */

import React from "react";
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react";

interface ExecutionStatusIndicatorProps {
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  className?: string;
}

const ExecutionStatusIndicator: React.FC<ExecutionStatusIndicatorProps> = ({
  status,
  error,
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

  return (
    <div 
      className={`absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${config.bgColor} ${config.color} ${className}`}
      title={config.title}
    >
      {config.icon}
    </div>
  );
};

export default ExecutionStatusIndicator;
