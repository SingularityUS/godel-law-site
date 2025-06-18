
/**
 * InlineSuggestionEditor Component
 * 
 * Purpose: Provides inline editing capability for redline suggestions
 */

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface InlineSuggestionEditorProps {
  originalText: string;
  suggestedText: string;
  onSave: (newText: string) => void;
  onCancel: () => void;
  position: { top: number; left: number; width: number };
}

const InlineSuggestionEditor: React.FC<InlineSuggestionEditorProps> = ({
  originalText,
  suggestedText,
  onSave,
  onCancel,
  position
}) => {
  const [editText, setEditText] = useState(suggestedText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus and select text when editor opens
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    if (editText.trim() !== suggestedText) {
      onSave(editText.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg p-2 min-w-48"
      style={{
        top: position.top + 25,
        left: position.left,
        minWidth: Math.max(position.width, 200)
      }}
    >
      <div className="text-xs text-gray-500 mb-1">
        Original: <span className="line-through">{originalText}</span>
      </div>
      <div className="flex gap-1">
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm h-8"
          placeholder="Enter your text..."
        />
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
        >
          <Check size={14} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
};

export default InlineSuggestionEditor;
