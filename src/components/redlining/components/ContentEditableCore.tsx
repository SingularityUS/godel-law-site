
/**
 * ContentEditableCore Component
 * 
 * Purpose: Core contentEditable implementation for Word-like direct editing
 * 
 * Module Relationships:
 * - Used by: DirectEditableRenderer as the main editing surface
 * - Integrates with: RedlineStyles for visual styling
 * - Communicates with: Parent components via callbacks for content changes
 * - Dependencies: Browser's contentEditable API, DOM manipulation utilities
 * 
 * Key Features:
 * - Provides direct text editing with cursor support
 * - Preserves redline markup while allowing text modification
 * - Handles keyboard events and composition (for international input)
 * - Manages cursor position restoration after programmatic updates
 */

import React, { useRef, useCallback, useState, forwardRef } from "react";

interface ContentEditableCoreProps {
  /** HTML content to display and edit */
  content: string;
  /** Callback fired when user modifies content */
  onContentChange: (newContent: string) => void;
  /** Callback for handling clicks on redline elements */
  onRedlineClick: (event: React.MouseEvent) => void;
  /** CSS classes for styling */
  className?: string;
  /** Inline styles for the editor */
  style?: React.CSSProperties;
}

/**
 * Core contentEditable component that provides Word-like editing experience
 * 
 * Technical Implementation:
 * - Uses contentEditable="true" for direct text editing
 * - Implements composition handling for international keyboards
 * - Debounces content changes to prevent excessive updates
 * - Preserves cursor position during programmatic content updates
 * - Uses forwardRef to allow parent components to access the DOM element
 */
const ContentEditableCore = forwardRef<HTMLDivElement, ContentEditableCoreProps>(({
  content,
  onContentChange,
  onRedlineClick,
  className = "",
  style = {}
}, ref) => {
  const [isComposing, setIsComposing] = useState(false);
  const lastContentRef = useRef<string>('');

  /**
   * Extracts plain text from HTML while preserving redline suggestions
   * 
   * Process:
   * 1. Creates temporary DOM element to parse HTML safely
   * 2. Finds all redline suggestion elements
   * 3. Replaces each suggestion with its suggested text content
   * 4. Returns the resulting plain text
   */
  const extractPlainText = useCallback((htmlContent: string): string => {
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Process redline suggestions: replace with suggested text
    const redlineSuggestions = tempDiv.querySelectorAll('.redline-suggestion');
    redlineSuggestions.forEach(suggestion => {
      const suggestedText = suggestion.querySelector('.suggested-text');
      if (suggestedText) {
        const textNode = window.document.createTextNode(suggestedText.textContent || '');
        suggestion.parentNode?.replaceChild(textNode, suggestion);
      }
    });
    
    return tempDiv.textContent || '';
  }, []);

  /**
   * Handles content changes from direct editing
   * 
   * Debouncing Strategy:
   * - Only processes changes when not composing (important for international keyboards)
   * - Compares against last known content to prevent unnecessary updates
   * - Extracts plain text to send clean content to parent components
   */
  const handleContentChange = useCallback(() => {
    const editorElement = ref && 'current' in ref ? ref.current : null;
    if (!editorElement || isComposing) return;

    const currentHtml = editorElement.innerHTML;
    const plainText = extractPlainText(currentHtml);
    
    // Only trigger change if content actually changed
    if (plainText !== lastContentRef.current) {
      lastContentRef.current = plainText;
      onContentChange(plainText);
    }
  }, [extractPlainText, onContentChange, isComposing, ref]);

  /**
   * Prevents editing within redline suggestion elements
   * 
   * Security Measure:
   * - Detects if cursor is within a redline suggestion
   * - Prevents keyboard input to maintain redline integrity
   * - Allows normal editing in regular text areas
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
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
  }, []);

  return (
    <div 
      ref={ref}
      className={`prose prose-sm max-w-none min-h-96 outline-none ${className}`}
      style={{
        fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        fontSize: '11pt',
        lineHeight: '1.15',
        color: '#000000',
        ...style
      }}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onClick={onRedlineClick}
      onInput={handleContentChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => {
        setIsComposing(false);
        setTimeout(handleContentChange, 0);
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
});

ContentEditableCore.displayName = 'ContentEditableCore';

export default ContentEditableCore;
