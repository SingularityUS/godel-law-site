import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RedlineDocument, RedlineState, RedlineSuggestion } from "@/types/redlining";
import RedlineToolbar from "./RedlineToolbar";
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
  const pendingSuggestions = filteredSuggestions.filter(s => s.status === 'pending');

  const handleSuggestionClick = (suggestionId: string) => {
    const suggestion = filteredSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      navigateToSuggestion(suggestionId);
      
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

  const handleSuggestionActionWithTooltipClose = (suggestionId: string, action: 'accepted' | 'rejected' | 'modified', newText?: string) => {
    handleSuggestionAction(suggestionId, action, newText);
    handleCloseTooltip();
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

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <Card className="h-full flex flex-col border-0 rounded-none">
        <CardHeader className="border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              Document Redlining - {currentDoc.metadata.fileName}
            </CardTitle>
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
        
        <CardContent className="flex-1 flex p-0 overflow-hidden">
          {/* Main document area */}
          <div className={`flex-1 ${showSidebar ? 'mr-80' : ''} transition-all duration-200 overflow-hidden`}>
            <div className="h-full overflow-y-auto">
              <EnhancedDocumentRenderer
                document={currentDoc}
                originalDocument={originalDocument || { type: 'text/plain' }}
                suggestions={filteredSuggestions}
                selectedSuggestionId={redlineState.selectedSuggestionId}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          </div>
          
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-80 border-l bg-gray-50 flex flex-col flex-shrink-0">
              <div className="p-4 border-b bg-white flex-shrink-0">
                <h3 className="font-semibold text-lg text-gray-800">
                  Suggestions ({pendingSuggestions.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Click on suggestions to review and accept/reject changes
                </p>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {pendingSuggestions.length > 0 ? (
                    pendingSuggestions.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-150 ${
                          redlineState.selectedSuggestionId === suggestion.id
                            ? 'bg-blue-100 border-blue-400 shadow-sm'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => navigateToSuggestion(suggestion.id)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                              suggestion.severity === 'high' ? 'bg-red-100 text-red-700' :
                              suggestion.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {suggestion.type} - {suggestion.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 font-medium">
                            {suggestion.explanation}
                          </p>
                          
                          <div className="text-xs space-y-1">
                            <div className="p-2 bg-red-50 rounded border-l-2 border-red-300">
                              <span className="font-medium text-red-700">From:</span> "{suggestion.originalText}"
                            </div>
                            <div className="p-2 bg-green-50 rounded border-l-2 border-green-300">
                              <span className="font-medium text-green-700">To:</span> "{suggestion.suggestedText}"
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No pending suggestions</p>
                      <p className="text-xs mt-1">All suggestions have been reviewed</p>
                    </div>
                  )}
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
