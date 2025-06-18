
/**
 * Redline Suggestion Tooltip Component
 * 
 * Purpose: Shows suggestion details and actions in a tooltip overlay
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit3 } from "lucide-react";
import { RedlineSuggestion } from "@/types/redlining";

interface RedlineSuggestionTooltipProps {
  suggestion: RedlineSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onModify: () => void;
  position: { x: number; y: number };
}

const RedlineSuggestionTooltip: React.FC<RedlineSuggestionTooltipProps> = ({
  suggestion,
  onAccept,
  onReject,
  onModify,
  position
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'bg-blue-100 text-blue-800';
      case 'style': return 'bg-purple-100 text-purple-800';
      case 'legal': return 'bg-orange-100 text-orange-800';
      case 'clarity': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge className={getTypeColor(suggestion.type)}>
          {suggestion.type}
        </Badge>
        <Badge variant="outline" className={getSeverityColor(suggestion.severity)}>
          {suggestion.severity}
        </Badge>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Original:</div>
        <div className="text-sm bg-red-50 p-2 rounded text-red-700 line-through">
          {suggestion.originalText}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Suggested:</div>
        <div className="text-sm bg-green-50 p-2 rounded text-green-700">
          {suggestion.suggestedText}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Explanation:</div>
        <div className="text-xs text-gray-800">{suggestion.explanation}</div>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
          <Check size={12} className="mr-1" />
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={onReject}>
          <X size={12} className="mr-1" />
          Reject
        </Button>
        <Button size="sm" variant="outline" onClick={onModify}>
          <Edit3 size={12} className="mr-1" />
          Edit
        </Button>
      </div>
      
      {/* Tooltip arrow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
      </div>
    </div>
  );
};

export default RedlineSuggestionTooltip;
