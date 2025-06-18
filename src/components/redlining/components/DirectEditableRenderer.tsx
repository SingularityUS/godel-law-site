
/**
 * DirectEditableRenderer Component
 * 
 * Purpose: Orchestrates Word-like direct editing with preserved redline markup
 * 
 * Module Relationships:
 * - Integrates: ContentEditableCore for editing, CursorPositionManager for cursor handling
 * - Uses: RedlineInteractionHandler for suggestion interactions
 * - Depends on: useRedlineContent hook for content processing
 * - Communicates with: Parent components via comprehensive callback system
 * 
 * Architecture Overview:
 * This component acts as the main coordinator for direct document editing.
 * It combines several specialized modules to provide a seamless editing experience
 * while maintaining the integrity of redline suggestions and document structure.
 * 
 * Data Flow:
 * 1. Receives document and suggestions from parent
 * 2. useRedlineContent processes and injects redline markup
 * 3. ContentEditableCore renders editable content
 * 4. User interactions flow through RedlineInteractionHandler
 * 5. Content changes are processed and sent back to parent
 * 6. CursorPositionManager maintains cursor during updates
 */

import React, { useRef, useEffect, useCallback } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { useRedlineContent } from "../hooks/useRedlineContent";
import RedlineStyles from "./RedlineStyles";
import ContentEditableCore from "./ContentEditableCore";
import RedlineInteractionHandler from "./RedlineInteractionHandler";
import { useCursorPositionManager } from "./CursorPositionManager";
import { TextRange } from "../utils/textSelection";

interface DirectEditableRendererProps {
  /** The redline document containing content and metadata */
  document: RedlineDocument;
  /** Original document reference for content extraction */
  originalDocument: { type: string; preview?: string };
  /** Array of redline suggestions to display */
  suggestions: RedlineSuggestion[];
  /** ID of currently selected suggestion for highlighting */
  selectedSuggestionId: string | null;
  /** Callback when user clicks on a suggestion */
  onSuggestionClick: (suggestionId: string) => void;
  /** Callback when user accepts a suggestion via accept button */
  onSuggestionAccept?: (suggestionId: string) => void;
  /** Callback when user modifies a suggestion */
  onSuggestionModify?: (suggestionId: string, newText: string) => void;
  /** Callback for manual text edits */
  onManualEdit?: (range: TextRange, newText: string) => void;
  /** Callback when document content changes */
  onContentChange: (newContent: string) => void;
}

/**
 * Main component providing Word-like document editing with redline support
 * 
 * Key Features:
 * - Direct cursor-based editing without popups
 * - Preserved redline markup during editing
 * - Real-time content synchronization
 * - Interactive redline suggestions
 * - Automatic cursor position management
 */
const DirectEditableRenderer: React.FC<DirectEditableRendererProps> = ({
  document: redlineDocument,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick,
  onSuggestionAccept,
  onSuggestionModify,
  onManualEdit,
  onContentChange
}) => {
  // Content processing hook - converts document + suggestions to rich HTML
  const { richContent, isLoading } = useRedlineContent({
    document: redlineDocument,
    originalDocument,
    suggestions,
    selectedSuggestionId
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const { saveCursorPosition, restoreCursor } = useCursorPositionManager(editorRef);

  /**
   * Synchronizes rich content updates while preserving cursor position
   * 
   * Update Strategy:
   * 1. Save current cursor position before update
   * 2. Update the HTML content with new redline markup
   * 3. Restore cursor to approximately the same location
   * 4. Handle edge cases where content length changes significantly
   */
  useEffect(() => {
    if (editorRef.current && richContent !== editorRef.current.innerHTML) {
      // Save cursor position before content update
      saveCursorPosition();
      
      // Update content with new redline markup
      editorRef.current.innerHTML = richContent;
      
      // Restore cursor position after update
      setTimeout(() => {
        restoreCursor();
      }, 0);
    }
  }, [richContent, saveCursorPosition, restoreCursor]);

  /**
   * Handles content changes from direct user editing
   * 
   * Processing Flow:
   * 1. Receives plain text from ContentEditableCore
   * 2. Validates content has actually changed
   * 3. Forwards to parent component for document state update
   * 4. Parent will trigger re-render with updated redline positions
   */
  const handleContentChange = useCallback((newContent: string) => {
    onContentChange(newContent);
  }, [onContentChange]);

  /**
   * Handles redline-specific interactions
   * 
   * Interaction Types:
   * - Suggestion clicks for selection/highlighting
   * - Accept button clicks for quick approval
   * - Future: Inline editing capabilities
   */
  const handleRedlineInteraction = useCallback((suggestionId: string) => {
    onSuggestionClick(suggestionId);
  }, [onSuggestionClick]);

  const handleSuggestionAccept = useCallback((suggestionId: string) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestionId);
    }
  }, [onSuggestionAccept]);

  // Loading state with professional appearance
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 w-full h-full overflow-y-auto relative">
      {/* Redline styling definitions */}
      <RedlineStyles />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg p-16 relative">
          {/* Redline interaction wrapper */}
          <RedlineInteractionHandler
            onSuggestionClick={handleRedlineInteraction}
            onSuggestionAccept={handleSuggestionAccept}
          >
            {/* Core contentEditable component */}
            <ContentEditableCore
              ref={editorRef}
              content={richContent}
              onContentChange={handleContentChange}
              onRedlineClick={() => {}} // Handled by RedlineInteractionHandler
            />
          </RedlineInteractionHandler>
        </div>
      </div>
    </div>
  );
};

export default DirectEditableRenderer;
