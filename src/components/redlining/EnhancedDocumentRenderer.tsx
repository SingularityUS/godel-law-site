
/**
 * Enhanced Document Renderer Component
 * 
 * Purpose: Renders documents with original formatting and inline redline suggestions
 */

import React, { useState } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { useRedlineContent } from "./hooks/useRedlineContent";
import RedlineStyles from "./components/RedlineStyles";
import InlineSuggestionEditor from "./components/InlineSuggestionEditor";

interface EnhancedDocumentRendererProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
  onSuggestionAccept?: (suggestionId: string) => void;
  onSuggestionModify?: (suggestionId: string, newText: string) => void;
}

interface InlineEditorState {
  suggestionId: string;
  originalText: string;
  suggestedText: string;
  position: { top: number; left: number; width: number };
}

const EnhancedDocumentRenderer: React.FC<EnhancedDocumentRendererProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick,
  onSuggestionAccept,
  onSuggestionModify
}) => {
  const { richContent, isLoading } = useRedlineContent({
    document,
    originalDocument,
    suggestions,
    selectedSuggestionId
  });

  const [inlineEditor, setInlineEditor] = useState<InlineEditorState | null>(null);

  const handleContentClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Handle accept button clicks
    const acceptBtn = target.closest('.redline-accept-btn');
    if (acceptBtn) {
      event.stopPropagation();
      const suggestionId = acceptBtn.getAttribute('data-suggestion-id');
      if (suggestionId && onSuggestionAccept) {
        onSuggestionAccept(suggestionId);
      }
      return;
    }

    // Handle suggestion text clicks for inline editing
    const editableText = target.closest('[data-editable="true"]');
    if (editableText) {
      event.stopPropagation();
      const suggestionElement = editableText.closest('.redline-suggestion');
      
      if (suggestionElement) {
        const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
        const originalText = suggestionElement.getAttribute('data-original-text');
        const suggestedText = suggestionElement.getAttribute('data-suggested-text');
        
        if (suggestionId && originalText && suggestedText) {
          const rect = editableText.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          setInlineEditor({
            suggestionId,
            originalText,
            suggestedText,
            position: {
              top: rect.top + scrollTop,
              left: rect.left,
              width: rect.width
            }
          });
        }
      }
      return;
    }

    // Handle regular suggestion clicks
    const suggestionElement = target.closest('.redline-suggestion');
    if (suggestionElement) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
      if (suggestionId) {
        onSuggestionClick(suggestionId);
      }
    }
  };

  const handleInlineEditorSave = (newText: string) => {
    if (inlineEditor && onSuggestionModify) {
      onSuggestionModify(inlineEditor.suggestionId, newText);
    }
    setInlineEditor(null);
  };

  const handleInlineEditorCancel = () => {
    setInlineEditor(null);
  };

  // Close inline editor when clicking outside
  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.inline-suggestion-editor') && !target.closest('[data-editable="true"]')) {
      setInlineEditor(null);
    }
  };

  React.useEffect(() => {
    if (inlineEditor) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [inlineEditor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document with redlines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 w-full h-full overflow-y-auto relative">
      <RedlineStyles />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg p-16 relative">
          <div 
            className="prose prose-sm max-w-none"
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: richContent }}
          />
        </div>
      </div>
      
      {inlineEditor && (
        <div className="inline-suggestion-editor">
          <InlineSuggestionEditor
            originalText={inlineEditor.originalText}
            suggestedText={inlineEditor.suggestedText}
            onSave={handleInlineEditorSave}
            onCancel={handleInlineEditorCancel}
            position={inlineEditor.position}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentRenderer;
