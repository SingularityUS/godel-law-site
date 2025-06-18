
/**
 * RedlineDocumentArea Component
 * 
 * Purpose: Renders the main document content area with redline functionality and edit mode
 */

import React from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import EnhancedDocumentRenderer from "../EnhancedDocumentRenderer";
import EditableDocumentRenderer from "../EditableDocumentRenderer";

interface RedlineDocumentAreaProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  showSidebar: boolean;
  isEditMode: boolean;
  onSuggestionClick: (suggestionId: string) => void;
  onContentChange: (newContent: string) => void;
}

const RedlineDocumentArea: React.FC<RedlineDocumentAreaProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  showSidebar,
  isEditMode,
  onSuggestionClick,
  onContentChange
}) => {
  return (
    <div className={`flex-1 ${showSidebar ? 'mr-80' : ''} transition-all duration-200 overflow-hidden`}>
      <div className="h-full overflow-y-auto">
        {isEditMode ? (
          <EditableDocumentRenderer
            document={document}
            onContentChange={onContentChange}
          />
        ) : (
          <EnhancedDocumentRenderer
            document={document}
            originalDocument={originalDocument}
            suggestions={suggestions}
            selectedSuggestionId={selectedSuggestionId}
            onSuggestionClick={onSuggestionClick}
          />
        )}
      </div>
    </div>
  );
};

export default RedlineDocumentArea;
