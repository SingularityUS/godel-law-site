
/**
 * Enhanced Document Renderer Component
 * 
 * Purpose: Renders documents with original formatting and inline redline suggestions
 */

import React, { useState } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { useRedlineContent } from "./hooks/useRedlineContent";
import RedlineStyles from "./components/RedlineStyles";
import GenericInlineEditor from "./components/GenericInlineEditor";
import { getTextRangeFromClick, TextRange } from "./utils/textSelection";

interface EnhancedDocumentRendererProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
  onSuggestionAccept?: (suggestionId: string) => void;
  onSuggestionModify?: (suggestionId: string, newText: string) => void;
  onManualEdit?: (range: TextRange, newText: string) => void;
}

interface InlineEditorState {
  suggestionId?: string;
  originalText: string;
  suggestedText?: string;
  position: { top: number; left: number; width: number };
  mode: 'suggestion' | 'manual';
  textRange?: TextRange;
}

const EnhancedDocumentRenderer: React.FC<EnhancedDocumentRendererProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick,
  onSuggestionAccept,
  onSuggestionModify,
  onManualEdit
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
          const scrollTop = window.pageYOffset || window.document.documentElement.scrollTop;
          
          setInlineEditor({
            suggestionId,
            originalText,
            suggestedText,
            position: {
              top: rect.top + scrollTop,
              left: rect.left,
              width: rect.width
            },
            mode: 'suggestion'
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
      return;
    }

    // Handle manual text editing (clicks on regular text)
    if (onManualEdit && target.closest('.prose')) {
      event.stopPropagation();
      const proseContainer = target.closest('.prose') as HTMLElement;
      
      if (proseContainer) {
        const textRange = getTextRangeFromClick(target, proseContainer);
        
        if (textRange && textRange.selectedText.trim().length > 0) {
          const rect = target.getBoundingClientRect();
          const scrollTop = window.pageYOffset || window.document.documentElement.scrollTop;
          
          setInlineEditor({
            originalText: textRange.selectedText,
            position: {
              top: rect.top + scrollTop,
              left: rect.left,
              width: Math.max(rect.width, 100)
            },
            mode: 'manual',
            textRange
          });
        }
      }
    }
  };

  const handleInlineEditorSave = (newText: string) => {
    if (!inlineEditor) return;
    
    if (inlineEditor.mode === 'suggestion' && inlineEditor.suggestionId && onSuggestionModify) {
      onSuggestionModify(inlineEditor.suggestionId, newText);
    } else if (inlineEditor.mode === 'manual' && inlineEditor.textRange && onManualEdit) {
      onManualEdit(inlineEditor.textRange, newText);
    }
    
    setInlineEditor(null);
  };

  const handleInlineEditorCancel = () => {
    setInlineEditor(null);
  };

  // Close inline editor when clicking outside
  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.inline-editor') && !target.closest('[data-editable="true"]') && !target.closest('.prose')) {
      setInlineEditor(null);
    }
  };

  React.useEffect(() => {
    if (inlineEditor) {
      window.document.addEventListener('click', handleDocumentClick);
      return () => window.document.removeEventListener('click', handleDocumentClick);
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
            className="prose prose-sm max-w-none cursor-text"
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
        <div className="inline-editor">
          <GenericInlineEditor
            originalText={inlineEditor.originalText}
            suggestedText={inlineEditor.suggestedText}
            onSave={handleInlineEditorSave}
            onCancel={handleInlineEditorCancel}
            position={inlineEditor.position}
            mode={inlineEditor.mode}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentRenderer;
