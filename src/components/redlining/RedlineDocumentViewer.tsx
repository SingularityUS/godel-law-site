
/**
 * RedlineDocumentViewer Component
 * 
 * Purpose: Main interface for document redlining with track changes
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RedlineDocument, RedlineState, RedlineSuggestion } from "@/types/redlining";
import RedlineToolbar from "./RedlineToolbar";
import RedlineSuggestionComponent from "./RedlineSuggestion";
import EnhancedDocumentRenderer from "./EnhancedDocumentRenderer";
import RedlineSuggestionTooltip from "./RedlineSuggestionTooltip";
import { useRedlineDocument } from "@/hooks/redlining/useRedlineDocument";

interface RedlineDocumentViewerProps {
  document: RedlineDocument;
  originalDocument?: { type: string; preview?: string; name: string };
  onClose: () => void;
  onSave: (document: RedlineDocument) => void;
  onExport: (document: RedlineDocument, format: string) => void;
}

const RedlineDocumentViewer: React.FC<RedlineDocumentViewerProps> = ({
  document: redlineDocument,
  originalDocument,
  onClose,
  onSave,
  onExport
}) => {
  const {
    redlineState,
    handleSuggestionAction,
    navigateToSuggestion,
    applyFilters,
    filteredSuggestions,
    getCurrentDocument
  } = useRedlineDocument(redlineDocument);

  const [showSidebar, setShowSidebar] = useState(true);
  const [tooltipState, setTooltipState] = useState<{
    suggestion: RedlineSuggestion | null;
    position: { x: number; y: number };
  } | null>(null);

  const currentDoc = getCurrentDocument();

  const handleSuggestionClick = (suggestionId: string) => {
    const suggestion = filteredSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      navigateToSuggestion(suggestionId);
      
      // Show tooltip at cursor position
      const handleMouseMove = (event: MouseEvent) => {
        setTooltipState({
          suggestion,
          position: { x: event.clientX, y: event.clientY }
        });
        window.document.removeEventListener('mousemove', handleMouseMove);
      };
      
      window.document.addEventListener('mousemove', handleMouseMove);
    }
  };

  const handleCloseTooltip = () => {
    setTooltipState(null);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.redline-suggestion') && !target.closest('[data-tooltip]')) {
        handleCloseTooltip();
      }
    };

    if (tooltipState) {
      window.document.addEventListener('click', handleClickOutside);
      return () => window.document.removeEventListener('click', handleClickOutside);
    }
  }, [tooltipState]);

  const handleSuggestionActionWithTooltipClose = (suggestionId: string, action: 'accepted' | 'rejected' | 'modified', newText?: string) => {
    handleSuggestionAction(suggestionId, action, newText);
    handleCloseTooltip();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Document Redlining - {currentDoc.metadata.fileName}</CardTitle>
            <RedlineToolbar
              document={currentDoc}
              state={redlineState}
              onClose={onClose}
              onSave={() => onSave(currentDoc)}
              onExport={(format) => onExport(currentDoc, format)}
              onNavigate={navigateToSuggestion}
              onFilter={applyFilters}
              onToggleSidebar={() => setShowSidebar(!showSidebar)}
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex p-0">
          <div className={`flex-1 ${showSidebar ? 'mr-80' : ''}`}>
            <ScrollArea className="h-full">
              <EnhancedDocumentRenderer
                document={currentDoc}
                originalDocument={originalDocument || { type: 'text/plain' }}
                suggestions={filteredSuggestions}
                selectedSuggestionId={redlineState.selectedSuggestionId}
                onSuggestionClick={handleSuggestionClick}
              />
            </ScrollArea>
          </div>
          
          {showSidebar && (
            <div className="w-80 border-l bg-gray-50 p-4">
              <h3 className="font-semibold mb-4">
                Suggestions ({filteredSuggestions.filter(s => s.status === 'pending').length})
              </h3>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {filteredSuggestions.filter(s => s.status === 'pending').map(suggestion => (
                    <div
                      key={suggestion.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        redlineState.selectedSuggestionId === suggestion.id
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => navigateToSuggestion(suggestion.id)}
                    >
                      <div className="text-sm font-medium capitalize">
                        {suggestion.type} - {suggestion.severity}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {suggestion.explanation}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        "{suggestion.originalText}" → "{suggestion.suggestedText}"
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestion Tooltip */}
      {tooltipState && (
        <RedlineSuggestionTooltip
          suggestion={tooltipState.suggestion}
          position={tooltipState.position}
          onAccept={() => handleSuggestionActionWithTooltipClose(tooltipState.suggestion.id, 'accepted')}
          onReject={() => handleSuggestionActionWithTooltipClose(tooltipState.suggestion.id, 'rejected')}
          onModify={() => {
            // For now, just open the sidebar and focus on the suggestion
            setShowSidebar(true);
            navigateToSuggestion(tooltipState.suggestion.id);
            handleCloseTooltip();
          }}
        />
      )}
    </div>
  );
};

export default RedlineDocumentViewer;
