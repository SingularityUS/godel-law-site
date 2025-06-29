
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
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
   * Handles content changes with improved debouncing for smooth typing
   * 
   * Debouncing Strategy:
   * - Only processes changes when not composing (important for international keyboards)
   * - Uses timeout to batch rapid keystrokes together
   * - Compares against last known content to prevent unnecessary updates
   * - Extracts plain text to send clean content to parent components
   */
  const handleContentChange = useCallback(() => {
    if (isComposing) return;
    
    const editorElement = ref && 'current' in ref ? ref.current : null;
    if (!editorElement) return;

    // Clear existing timeout to debounce rapid changes
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }

    // Debounce content changes to prevent excessive updates during typing
    changeTimeoutRef.current = setTimeout(() => {
      const currentHtml = editorElement.innerHTML;
      const plainText = extractPlainText(currentHtml);
      
      console.log('Content change processed:', { 
        plainTextLength: plainText.length, 
        lastContentLength: lastContentRef.current.length,
        isComposing 
      });
      
      // Only trigger change if content actually changed
      if (plainText !== lastContentRef.current) {
        lastContentRef.current = plainText;
        console.log('Triggering debounced content change callback');
        onContentChange(plainText);
      }
    }, 100); // 100ms debounce for smooth typing
  }, [extractPlainText, onContentChange, isComposing, ref]);

  /**
   * Improved redline detection and keyboard event handling
   * 
   * Security Measure:
   * - Only prevents editing within actual redline suggestion elements
   * - Checks for specific redline classes and contentEditable attributes
   * - Allows normal editing in regular text areas
   * - Provides debug logging to track event blocking
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'Target:', (event.target as HTMLElement).tagName);
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.log('No selection found, allowing input');
      return;
    }
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Get the element containing the cursor
    const element = container.nodeType === Node.TEXT_NODE ? 
      container.parentElement : container as HTMLElement;
    
    console.log('Cursor container element:', element?.tagName, element?.className);
    
    // Only prevent editing if cursor is within a redline suggestion that's marked as non-editable
    const suggestionElement = element?.closest('.redline-suggestion[contenteditable="false"]');
    
    if (suggestionElement) {
      console.log('Preventing edit in protected redline suggestion:', suggestionElement.getAttribute('data-suggestion-id'));
      event.preventDefault();
      return;
    }
    
    // Also check for accept buttons or other protected elements
    const protectedElement = element?.closest('.redline-accept-btn, .redline-protected');
    if (protectedElement) {
      console.log('Preventing edit in protected element:', protectedElement.className);
      event.preventDefault();
      return;
    }
    
    console.log('Allowing keyboard input in regular text area');
  }, []);

  return (
    <>
      <div 
        ref={ref}
        className={`prose prose-sm max-w-none min-h-96 outline-none document-content ${className}`}
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
        onCompositionStart={() => {
          console.log('Composition started');
          setIsComposing(true);
        }}
        onCompositionEnd={() => {
          console.log('Composition ended');
          setIsComposing(false);
          setTimeout(handleContentChange, 0);
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .document-content .text-center {
            text-align: center !important;
          }
          
          .document-content .text-right {
            text-align: right !important;
          }
          
          .document-content .text-justify {
            text-align: justify !important;
          }
          
          .document-content .text-indent {
            text-indent: 0.5in !important;
          }
          
          .document-content .margin-left {
            margin-left: 0.5in !important;
          }
          
          .document-content .document-title {
            font-size: 16pt !important;
            font-weight: bold !important;
            text-align: center !important;
            margin: 12pt 0 !important;
            line-height: 1.2 !important;
          }
          
          .document-content .heading-1 {
            font-size: 14pt !important;
            font-weight: bold !important;
            margin: 12pt 0 6pt 0 !important;
            line-height: 1.2 !important;
          }
          
          .document-content .heading-2 {
            font-size: 13pt !important;
            font-weight: bold !important;
            margin: 10pt 0 6pt 0 !important;
            line-height: 1.2 !important;
          }
          
          .document-content .heading-3 {
            font-size: 12pt !important;
            font-weight: bold !important;
            margin: 8pt 0 4pt 0 !important;
            line-height: 1.2 !important;
          }
          
          .document-content ul, .document-content ol {
            margin: 6pt 0 !important;
            padding-left: 24pt !important;
          }
          
          .document-content li {
            margin: 3pt 0 !important;
            line-height: 1.15 !important;
          }
          
          .document-content u {
            text-decoration: underline !important;
          }
          
          .document-content s {
            text-decoration: line-through !important;
          }
          
          .document-content strong {
            font-weight: bold !important;
          }
          
          .document-content em {
            font-style: italic !important;
          }
          
          .document-content p {
            margin: 6pt 0 !important;
            line-height: 1.15 !important;
          }
          
          .document-content .list-paragraph {
            margin-left: 0.5in !important;
          }
          
          .document-content .tab-1 {
            margin-left: 0.5in !important;
          }
          
          .document-content .tab-2 {
            margin-left: 1in !important;
          }
          
          .document-content .tab-3 {
            margin-left: 1.5in !important;
          }
          
          .document-content .tab-4 {
            margin-left: 2in !important;
          }
          
          .formatted-document {
            line-height: 1.15 !important;
          }
          
          .formatted-document p {
            margin: 6pt 0 !important;
          }
          
          .formatted-document ul {
            list-style-type: disc !important;
            margin: 6pt 0 !important;
            padding-left: 24pt !important;
          }
          
          .formatted-document ol {
            list-style-type: decimal !important;  
            margin: 6pt 0 !important;
            padding-left: 24pt !important;
          }
          
          .formatted-document li {
            margin: 3pt 0 !important;
            line-height: 1.15 !important;
          }
        `
      }} />
    </>
  );
});

ContentEditableCore.displayName = 'ContentEditableCore';

export default ContentEditableCore;
