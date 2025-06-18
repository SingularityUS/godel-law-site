
/**
 * RedlineDocumentArea Component
 * 
 * Purpose: Renders the main document content area with redline functionality
 */

import React from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import EnhancedDocumentRenderer from "../EnhancedDocumentRenderer";

interface RedlineDocumentAreaProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  showSidebar: boolean;
  onSuggestionClick: (suggestionId: string) => void;
}

const RedlineDocumentArea: React.FC<RedlineDocumentAreaProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  showSidebar,
  onSuggestionClick
}) => {
  return (
    <div className={`flex-1 ${showSidebar ? 'mr-80' : ''} transition-all duration-200 overflow-hidden`}>
      <div className="h-full overflow-y-auto">
        <EnhancedDocumentRenderer
          document={document}
          originalDocument={originalDocument}
          suggestions={suggestions}
          selectedSuggestionId={selectedSuggestionId}
          onSuggestionClick={onSuggestionClick}
        />
      </div>
    </div>
  );
};

export default RedlineDocumentArea;
