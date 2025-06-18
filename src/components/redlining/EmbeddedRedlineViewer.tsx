
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RedlineDocument, RedlineState, RedlineSuggestion } from "@/types/redlining";
import RedlineDocumentArea from "./components/RedlineDocumentArea";
import RedlineSidebar from "./components/RedlineSidebar";
import RedlineTooltipManager from "./components/RedlineTooltipManager";
import { useRedlineDocument } from "@/hooks/redlining/useRedlineDocument";
import { useEditMode } from "@/hooks/redlining/useEditMode";
import { Button } from "@/components/ui/button";
import { Save, FileDown, Edit3, Eye } from "lucide-react";

interface EmbeddedRedlineViewerProps {
  document: RedlineDocument;
  originalDocument?: { type: string; preview?: string; name: string };
  onSave: (document: RedlineDocument) => void;
  onExport: (document: RedlineDocument, format: string) => void;
}

const EmbeddedRedlineViewer: React.FC<EmbeddedRedlineViewerProps> = ({
  document: redlineDocument,
  originalDocument,
  onSave,
  onExport
}) => {
  const {
    redlineState,
    document: currentDocument,
    handleSuggestionAction,
    acceptSuggestion,
    modifySuggestion,
    navigateToSuggestion,
    applyFilters,
    filteredSuggestions,
    getCurrentDocument,
    updateDocument,
    handleManualEdit,
    handleContentChange
  } = useRedlineDocument(redlineDocument);

  const {
    isEditMode,
    hasUnsavedChanges,
    toggleEditMode,
    handleContentChange: editModeContentChange,
    saveDocument
  } = useEditMode(currentDocument, updateDocument);

  const [showSuggestionsSidebar, setShowSuggestionsSidebar] = useState(false);

  const handleSuggestionClick = (suggestionId: string) => {
    navigateToSuggestion(suggestionId);
  };

  const handleSave = () => {
    saveDocument();
    onSave(getCurrentDocument());
  };

  // Use the appropriate content change handler based on mode
  const contentChangeHandler = isEditMode ? editModeContentChange : handleContentChange;

  const pendingSuggestions = filteredSuggestions.filter(s => s.status === 'pending');

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Compact Header */}
      <div className="border-b bg-gray-50 p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-800 truncate">
            {currentDocument.metadata.fileName}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEditMode}
              className="h-7 px-2"
            >
              {isEditMode ? <Eye size={14} /> : <Edit3 size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="h-7 px-2"
            >
              <Save size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport(getCurrentDocument(), 'docx')}
              className="h-7 px-2"
            >
              <FileDown size={14} />
            </Button>
          </div>
        </div>
        
        {/* Compact Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>{pendingSuggestions.length} pending</span>
          <span>{currentDocument.metadata.acceptedSuggestions} accepted</span>
          <span>{currentDocument.metadata.rejectedSuggestions} rejected</span>
          {!isEditMode && pendingSuggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestionsSidebar(!showSuggestionsSidebar)}
              className="h-6 px-2 text-xs"
            >
              {showSuggestionsSidebar ? 'Hide' : 'Show'} Suggestions
            </Button>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 min-w-0 ${showSuggestionsSidebar && !isEditMode ? '' : 'w-full'}`}>
          <RedlineDocumentArea
            document={currentDocument}
            originalDocument={originalDocument || { type: 'text/plain' }}
            suggestions={filteredSuggestions}
            selectedSuggestionId={redlineState.selectedSuggestionId}
            showSidebar={false} // We handle the sidebar separately
            isEditMode={isEditMode}
            onSuggestionClick={handleSuggestionClick}
            onContentChange={contentChangeHandler}
            onSuggestionAccept={acceptSuggestion}
            onSuggestionModify={modifySuggestion}
            onManualEdit={handleManualEdit}
          />
        </div>
        
        {/* Suggestions Sidebar - Only show in view mode */}
        {showSuggestionsSidebar && !isEditMode && (
          <div className="w-64 border-l bg-gray-50 flex-shrink-0">
            <RedlineSidebar
              suggestions={filteredSuggestions}
              selectedSuggestionId={redlineState.selectedSuggestionId}
              onSuggestionClick={navigateToSuggestion}
            />
          </div>
        )}
      </div>

      {/* Tooltip Manager - Only in view mode */}
      {!isEditMode && (
        <RedlineTooltipManager
          suggestions={filteredSuggestions}
          onSuggestionAction={handleSuggestionAction}
          onNavigateToSuggestion={navigateToSuggestion}
          onShowSidebar={() => setShowSuggestionsSidebar(true)}
        />
      )}
    </div>
  );
};

export default EmbeddedRedlineViewer;
