
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
import { useRedlineDocument } from "@/hooks/redlining/useRedlineDocument";

interface RedlineDocumentViewerProps {
  document: RedlineDocument;
  onClose: () => void;
  onSave: (document: RedlineDocument) => void;
  onExport: (document: RedlineDocument, format: string) => void;
}

const RedlineDocumentViewer: React.FC<RedlineDocumentViewerProps> = ({
  document,
  onClose,
  onSave,
  onExport
}) => {
  const {
    redlineState,
    handleSuggestionAction,
    navigateToSuggestion,
    applyFilters,
    getFilteredSuggestions,
    getCurrentDocument
  } = useRedlineDocument(document);

  const [showSidebar, setShowSidebar] = useState(true);
  const filteredSuggestions = getFilteredSuggestions();
  const currentDoc = getCurrentDocument();

  const renderDocumentContent = () => {
    const content = currentDoc.currentContent;
    const suggestions = filteredSuggestions.filter(s => s.status === 'pending');
    
    // Simple rendering for now - will enhance with proper text highlighting
    return (
      <div className="prose prose-sm max-w-none p-8">
        <div
          style={{
            fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.5',
            color: '#000000'
          }}
        >
          {content.split('\n').map((paragraph, index) => {
            const paragraphSuggestions = suggestions.filter(s => 
              content.substring(s.startPos, s.endPos).includes(paragraph.substring(0, 50))
            );
            
            return (
              <div key={index} className="mb-4 relative">
                <p className="mb-2">{paragraph}</p>
                {paragraphSuggestions.map(suggestion => (
                  <RedlineSuggestionComponent
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={() => handleSuggestionAction(suggestion.id, 'accepted')}
                    onReject={() => handleSuggestionAction(suggestion.id, 'rejected')}
                    onModify={(newText) => handleSuggestionAction(suggestion.id, 'modified', newText)}
                    isSelected={redlineState.selectedSuggestionId === suggestion.id}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
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
              {renderDocumentContent()}
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RedlineDocumentViewer;
