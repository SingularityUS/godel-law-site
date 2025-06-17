
/**
 * ChatGPTIndicator Component
 * 
 * Purpose: Visual indicator showing when a module supports or is using ChatGPT
 * Enhanced for legal document processing indication
 */

import React from "react";
import { Scale, Zap } from "lucide-react";

interface ChatGPTIndicatorProps {
  isActive?: boolean;
  isProcessing?: boolean;
  isLegalModule?: boolean;
  className?: string;
}

const ChatGPTIndicator: React.FC<ChatGPTIndicatorProps> = ({
  isActive = false,
  isProcessing = false,
  isLegalModule = false,
  className = ""
}) => {
  if (!isActive && !isProcessing) return null;

  return (
    <div className={`absolute top-1 left-1 ${className}`} title={isLegalModule ? "Legal AI Processing" : "AI Processing"}>
      {isLegalModule ? (
        <div className={`w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center ${isProcessing ? 'animate-pulse' : ''}`}>
          <Scale size={8} className="text-white" />
        </div>
      ) : (
        <div className={`w-1.5 h-1.5 bg-green-500 rounded-full ${isProcessing ? 'animate-pulse' : ''}`} />
      )}
    </div>
  );
};

export default ChatGPTIndicator;
