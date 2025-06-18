
/**
 * DirectEditableRenderer Component
 * 
 * Purpose: Orchestrates Word-like direct editing with preserved redline markup
 */

import React, { useRef, useEffect, useCallback, useState } from "react";
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
  const lastUserContentRef = useRef<string>('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [contentSource, setContentSource] = useState<'user' | 'system'>('system');

  /**
   * Extract plain text from HTML content for comparison
   */
  const extractPlainText = useCallback((htmlContent: string): string => {
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || '';
  }, []);

  /**
   * Smart content synchronization that prevents overwriting user edits
   */
  useEffect(() => {
    if (!editorRef.current || !richContent) return;
    
    const currentEditorContent = editorRef.current.innerHTML;
    const currentPlainText = extractPlainText(currentEditorContent);
    const newPlainText = extractPlainText(richContent);
    
    console.log('Content sync check:', {
      isUserTyping,
      contentSource,
      currentTextLength: currentPlainText.length,
      newTextLength: newPlainText.length,
      textChanged: currentPlainText !== newPlainText
    });
    
    // Skip updates during active typing to prevent overwrites
    if (isUserTyping && contentSource === 'user') {
      console.log('Skipping content update - user is actively typing');
      return;
    }
    
    // Only update if this is a legitimate markup change, not a content reversion
    const isMarkupOnlyChange = newPlainText === currentPlainText && richContent !== currentEditorContent;
    const isNewContent = richContent !== lastRichContentRef.current;
    
    // CRITICAL: Don't overwrite user content with older content
    if (contentSource === 'user' && newPlainText !== lastUserContentRef.current) {
      console.log('Preventing content reversion - preserving user edits');
      return;
    }
    
    if (isNewContent && (isMarkupOnlyChange || contentSource === 'system')) {
      console.log('Applying content update:', { isMarkupOnlyChange, contentSource });
      
      // Save cursor position only for markup changes
      if (isMarkupOnlyChange) {
        saveCursorPosition();
      }
      
      // Update content
      editorRef.current.innerHTML = richContent;
      lastRichContentRef.current = richContent;
      
      // Restore cursor only if we saved it
      if (isMarkupOnlyChange) {
        setTimeout(() => {
          console.log('Restoring cursor after markup change');
          restoreCursor();
        }, 0);
      }
    }
  }, [richContent, isUserTyping, contentSource, saveCursorPosition, restoreCursor, extractPlainText]);

  /**
   * Handles content changes from direct user editing with improved source tracking
   */
  const handleContentChange = useCallback((newContent: string) => {
    console.log('DirectEditableRenderer: User content change received, length:', newContent.length);
    
    // Mark this as user-initiated content
    setContentSource('user');
    setIsUserTyping(true);
    
    // Store the user's content to prevent reversions
    lastUserContentRef.current = newContent;
    
    // Forward content change to parent
    onContentChange(newContent);
    
    // Reset typing state after a delay
    setTimeout(() => {
      setIsUserTyping(false);
      setContentSource('system');
    }, 2000); // Increased delay to prevent premature updates
  }, [onContentChange]);

  /**
   * Handles redline-specific interactions
   */
  const handleRedlineInteraction = useCallback((suggestionId: string) => {
    console.log('Redline interaction:', suggestionId);
    setContentSource('system'); // Mark as system interaction
    onSuggestionClick(suggestionId);
  }, [onSuggestionClick]);

  const handleSuggestionAccept = useCallback((suggestionId: string) => {
    console.log('Accepting suggestion:', suggestionId);
    setContentSource('system'); // Mark as system interaction
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
