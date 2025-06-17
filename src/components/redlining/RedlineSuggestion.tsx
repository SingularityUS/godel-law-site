
/**
 * RedlineSuggestion Component
 * 
 * Purpose: Individual suggestion with accept/reject functionality
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit3, Info } from "lucide-react";
import { RedlineSuggestion as RedlineSuggestionType } from "@/types/redlining";

interface RedlineSuggestionProps {
  suggestion: RedlineSuggestionType;
  onAccept: () => void;
  onReject: () => void;
  onModify: (newText: string) => void;
  isSelected: boolean;
}

const RedlineSuggestion: React.FC<RedlineSuggestionProps> = ({
  suggestion,
  onAccept,
  onReject,
  onModify,
  isSelected
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(suggestion.suggestedText);

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

  const handleSaveEdit = () => {
    onModify(editText);
    setIsEditing(false);
  };

  return (
    <div className={`border-l-4 pl-4 my-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge className={getTypeColor(suggestion.type)}>
          {suggestion.type}
        </Badge>
        <Badge variant="outline" className={getSeverityColor(suggestion.severity)}>
          {suggestion.severity}
        </Badge>
        {suggestion.confidence && (
          <span className="text-xs text-gray-500">
            {Math.round(suggestion.confidence * 100)}% confidence
          </span>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-sm text-gray-600 mb-1">Original:</div>
        <div className="text-sm bg-red-50 p-2 rounded line-through text-red-700">
          {suggestion.originalText}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-sm text-gray-600 mb-1">Suggested:</div>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSaveEdit}>
              <Check size={14} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div className="text-sm bg-green-50 p-2 rounded text-green-700">
            {suggestion.suggestedText}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Info size={14} className="text-gray-400" />
        <span className="text-xs text-gray-600">{suggestion.explanation}</span>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
          <Check size={14} className="mr-1" />
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={onReject}>
          <X size={14} className="mr-1" />
          Reject
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Edit3 size={14} className="mr-1" />
          Modify
        </Button>
      </div>
    </div>
  );
};

export default RedlineSuggestion;
