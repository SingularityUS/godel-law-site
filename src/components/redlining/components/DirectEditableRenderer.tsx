
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
  const lastRichContentRef = useRef<string>('');

  /**
   * Optimized content synchronization with conflict prevention
   * 
   * Update Strategy:
   * 1. Only update if content has significantly changed
   * 2. Save cursor position before update
   * 3. Update the HTML content with new redline markup
   * 4. Restore cursor to approximately the same location
   * 5. Add debouncing to prevent rapid successive updates
   */
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Only update if content has actually changed significantly
    if (richContent !== lastRichContentRef.current && richContent !== editorRef.current.innerHTML) {
      console.log('Synchronizing rich content update');
      console.log('Rich content changed from', lastRichContentRef.current.length, 'to', richContent.length, 'chars');
      
      // Save cursor position before content update
      saveCursorPosition();
      
      // Update content with new redline markup
      editorRef.current.innerHTML = richContent;
      lastRichContentRef.current = richContent;
      
      // Restore cursor position after update
      setTimeout(() => {
        console.log('Restoring cursor position after content sync');
        restoreCursor();
      }, 0);
    }
  }, [richContent, saveCursorPosition, restoreCursor]);

  /**
   * Handles content changes from direct user editing with improved debouncing
   * 
   * Processing Flow:
   * 1. Receives plain text from ContentEditableCore
   * 2. Validates content has actually changed
   * 3. Forwards to parent component for document state update
   * 4. Parent will trigger re-render with updated redline positions
   */
  const handleContentChange = useCallback((newContent: string) => {
    console.log('DirectEditableRenderer: Content change received, length:', newContent.length);
    onContentChange(newContent);
  }, [onContentChange]);

  /**
   * Handles redline-specific interactions without interfering with typing
   * 
   * Interaction Types:
   * - Suggestion clicks for selection/highlighting
   * - Accept button clicks for quick approval
   * - Future: Inline editing capabilities
   */
  const handleRedlineInteraction = useCallback((suggestionId: string) => {
    console.log('Redline interaction:', suggestionId);
    onSuggestionClick(suggestionId);
  }, [onSuggestionClick]);

  const handleSuggestionAccept = useCallback((suggestionId: string) => {
    console.log('Accepting suggestion:', suggestionId);
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
          {/* Redline interaction wrapper - handles suggestion clicks without blocking keyboard */}
          <RedlineInteractionHandler
            onSuggestionClick={handleRedlineInteraction}
            onSuggestionAccept={handleSuggestionAccept}
          >
            {/* Core contentEditable component - handles all text editing */}
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
