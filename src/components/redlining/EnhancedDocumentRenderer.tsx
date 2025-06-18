
/**
 * Enhanced Document Renderer Component
 * 
 * Purpose: Renders documents with original formatting and inline redline suggestions
 */

import React from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { useRedlineContent } from "./hooks/useRedlineContent";
import RedlineStyles from "./components/RedlineStyles";

interface EnhancedDocumentRendererProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
}

const EnhancedDocumentRenderer: React.FC<EnhancedDocumentRendererProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick
}) => {
  const { richContent, isLoading } = useRedlineContent({
    document,
    originalDocument,
    suggestions,
    selectedSuggestionId
  });

  const handleContentClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const suggestionElement = target.closest('.redline-suggestion');
    
    if (suggestionElement) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
      if (suggestionId) {
        onSuggestionClick(suggestionId);
      }
    }
  };

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
    <div className="bg-gray-100 w-full h-full overflow-y-auto">
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
    </div>
  );
};

export default EnhancedDocumentRenderer;
