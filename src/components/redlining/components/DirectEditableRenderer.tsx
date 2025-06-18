
/**
 * Direct Editable Renderer Component
 * 
 * Purpose: Provides Word-like direct editing with cursor support while preserving redline markup
 */

import React, { useRef, useEffect, useCallback, useState } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { useRedlineContent } from "../hooks/useRedlineContent";
import RedlineStyles from "./RedlineStyles";
import { TextRange } from "../utils/textSelection";

interface DirectEditableRendererProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
  onSuggestionAccept?: (suggestionId: string) => void;
  onSuggestionModify?: (suggestionId: string, newText: string) => void;
  onManualEdit?: (range: TextRange, newText: string) => void;
  onContentChange: (newContent: string) => void;
}

const DirectEditableRenderer: React.FC<DirectEditableRendererProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick,
  onSuggestionAccept,
  onSuggestionModify,
  onManualEdit,
  onContentChange
}) => {
  const { richContent, isLoading } = useRedlineContent({
    document,
    originalDocument,
    suggestions,
    selectedSuggestionId
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const lastContentRef = useRef<string>('');

  // Extract plain text from HTML content
  const extractPlainText = useCallback((htmlContent: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove redline markup but preserve the suggested text
    const redlineSuggestions = tempDiv.querySelectorAll('.redline-suggestion');
    redlineSuggestions.forEach(suggestion => {
      const suggestedText = suggestion.querySelector('.suggested-text');
      if (suggestedText) {
        const textNode = document.createTextNode(suggestedText.textContent || '');
        suggestion.parentNode?.replaceChild(textNode, suggestion);
      }
    });
    
    return tempDiv.textContent || '';
  }, []);

  // Handle content changes from direct editing
  const handleContentChange = useCallback(() => {
    if (!editorRef.current || isComposing) return;

    const currentHtml = editorRef.current.innerHTML;
    const plainText = extractPlainText(currentHtml);
    
    // Only trigger change if content actually changed
    if (plainText !== lastContentRef.current) {
      lastContentRef.current = plainText;
      onContentChange(plainText);
    }
  }, [extractPlainText, onContentChange, isComposing]);

  // Handle click events for redline interactions
  const handleEditorClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Handle accept button clicks
    const acceptBtn = target.closest('.redline-accept-btn');
    if (acceptBtn) {
      event.preventDefault();
      event.stopPropagation();
      const suggestionId = acceptBtn.getAttribute('data-suggestion-id');
      if (suggestionId && onSuggestionAccept) {
        onSuggestionAccept(suggestionId);
      }
      return;
    }

    // Handle suggestion clicks
    const suggestionElement = target.closest('.redline-suggestion');
    if (suggestionElement) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
      if (suggestionId) {
        onSuggestionClick(suggestionId);
      }
      return;
    }
  }, [onSuggestionClick, onSuggestionAccept]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Prevent editing within redline suggestions
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const suggestionElement = (container.nodeType === Node.TEXT_NODE ? 
        container.parentElement : container as HTMLElement)?.closest('.redline-suggestion');
      
      if (suggestionElement) {
        event.preventDefault();
        return;
      }
    }

    // Handle Ctrl+Z for undo (optional - browser handles this naturally)
    if (event.ctrlKey && event.key === 'z') {
      // Let browser handle undo naturally
      return;
    }
  }, []);

  // Update editor content when richContent changes
  useEffect(() => {
    if (editorRef.current && richContent !== editorRef.current.innerHTML) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      
      // Store cursor position
      let cursorPosition = 0;
      if (range && editorRef.current.contains(range.startContainer)) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorPosition = preCaretRange.toString().length;
      }

      // Update content
      editorRef.current.innerHTML = richContent;
      lastContentRef.current = extractPlainText(richContent);

      // Restore cursor position
      if (cursorPosition > 0) {
        try {
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let currentPos = 0;
          let textNode = walker.nextNode() as Text;
          
          while (textNode) {
            const nodeLength = textNode.textContent?.length || 0;
            if (currentPos + nodeLength >= cursorPosition) {
              const offset = cursorPosition - currentPos;
              const newRange = document.createRange();
              newRange.setStart(textNode, Math.min(offset, nodeLength));
              newRange.collapse(true);
              selection?.removeAllRanges();
              selection?.addRange(newRange);
              break;
            }
            currentPos += nodeLength;
            textNode = walker.nextNode() as Text;
          }
        } catch (error) {
          console.warn('Could not restore cursor position:', error);
        }
      }
    }
  }, [richContent, extractPlainText]);

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
      <RedlineStyles />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg p-16 relative">
          <div 
            ref={editorRef}
            className="prose prose-sm max-w-none min-h-96 outline-none"
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onClick={handleEditorClick}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => {
              setIsComposing(false);
              setTimeout(handleContentChange, 0);
            }}
            dangerouslySetInnerHTML={{ __html: richContent }}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectEditableRenderer;
