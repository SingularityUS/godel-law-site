
/**
 * ChatGPTIndicator Component
 * 
 * Purpose: Visual indicator showing when a module supports or is using ChatGPT
 * Displays on helper nodes to indicate AI enhancement capabilities
 */

import React from "react";
import { MessageSquare, Zap } from "lucide-react";

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
    <div className={`absolute -top-1 -left-1 ${className}`}>
      {isProcessing ? (
        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
          <Zap size={8} className="text-white" />
        </div>
      ) : (
        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
          <MessageSquare size={8} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatGPTIndicator;
