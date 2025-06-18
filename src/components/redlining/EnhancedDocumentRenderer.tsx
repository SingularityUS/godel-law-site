
/**
 * Enhanced Document Renderer Component
 * 
 * Purpose: Renders documents with Word-like direct editing and inline redline suggestions
 */

import React from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import DirectEditableRenderer from "./components/DirectEditableRenderer";
import { TextRange } from "./utils/textSelection";

interface EnhancedDocumentRendererProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
  onSuggestionAccept?: (suggestionId: string) => void;
  onSuggestionModify?: (suggestionId: string, newText: string) => void;
  onManualEdit?: (range: TextRange, newText: string) => void;
  onContentChange: (newContent: string) => void;
}

const EnhancedDocumentRenderer: React.FC<EnhancedDocumentRendererProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick,
  onSuggestionAccept,
  onSuggestionModify,
  onManualEdit,
  onContentChange
}) => {
  return (
    <DirectEditableRenderer
      document={document}
      originalDocument={originalDocument}
      suggestions={suggestions}
      selectedSuggestionId={selectedSuggestionId}
      onSuggestionClick={onSuggestionClick}
      onSuggestionAccept={onSuggestionAccept}
      onSuggestionModify={onSuggestionModify}
      onManualEdit={onManualEdit}
      onContentChange={onContentChange}
    />
  );
};

export default EnhancedDocumentRenderer;
