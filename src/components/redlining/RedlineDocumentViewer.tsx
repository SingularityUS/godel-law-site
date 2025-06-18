
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RedlineDocument, RedlineState, RedlineSuggestion } from "@/types/redlining";
import RedlineToolbar from "./RedlineToolbar";
import RedlineDocumentArea from "./components/RedlineDocumentArea";
import RedlineSidebar from "./components/RedlineSidebar";
import RedlineTooltipManager from "./components/RedlineTooltipManager";
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

  const currentDoc = getCurrentDocument();

  const handleSuggestionClick = (suggestionId: string) => {
    navigateToSuggestion(suggestionId);
  };

  const handleShowSidebar = () => {
    setShowSidebar(true);
  };

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
          <RedlineDocumentArea
            document={currentDoc}
            originalDocument={originalDocument || { type: 'text/plain' }}
            suggestions={filteredSuggestions}
            selectedSuggestionId={redlineState.selectedSuggestionId}
            showSidebar={showSidebar}
            onSuggestionClick={handleSuggestionClick}
          />
          
          {showSidebar && (
            <RedlineSidebar
              suggestions={filteredSuggestions}
              selectedSuggestionId={redlineState.selectedSuggestionId}
              onSuggestionClick={navigateToSuggestion}
            />
          )}
        </CardContent>
      </Card>

      <RedlineTooltipManager
        suggestions={filteredSuggestions}
        onSuggestionAction={handleSuggestionAction}
        onNavigateToSuggestion={navigateToSuggestion}
        onShowSidebar={handleShowSidebar}
      />
    </div>
  );
};

export default RedlineDocumentViewer;
