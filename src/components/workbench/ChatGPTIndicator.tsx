
/**
 * ChatGPTIndicator Component
 * 
 * Purpose: Visual indicator showing when a module supports or is using ChatGPT
 * Displays on helper nodes to indicate AI enhancement capabilities
 */

import React from "react";

interface ChatGPTIndicatorProps {
  isActive?: boolean;
  isProcessing?: boolean;
  className?: string;
}

const ChatGPTIndicator: React.FC<ChatGPTIndicatorProps> = ({
  isActive = false,
  isProcessing = false,
  className = ""
}) => {
  if (!isActive && !isProcessing) return null;

  return (
    <div className={`absolute top-1 left-1 ${className}`}>
      <div className={`w-1.5 h-1.5 bg-green-500 rounded-full ${isProcessing ? 'animate-pulse' : ''}`} />
    </div>
  );
};

export default ChatGPTIndicator;
