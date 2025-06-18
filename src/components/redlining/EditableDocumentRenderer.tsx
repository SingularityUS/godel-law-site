
/**
 * Editable Document Renderer Component
 * 
 * Purpose: Allows direct editing of document content with proper cursor management
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RedlineDocument } from "@/types/redlining";

interface EditableDocumentRendererProps {
  document: RedlineDocument;
  onContentChange: (newContent: string) => void;
  className?: string;
}

const EditableDocumentRenderer: React.FC<EditableDocumentRendererProps> = ({
  document,
  onContentChange,
  className = ""
}) => {
  const [localContent, setLocalContent] = useState(document.currentContent);
  const editorRef = useRef<HTMLDivElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);

  // Update local content when document changes, preserving cursor position
  useEffect(() => {
    if (document.currentContent !== localContent) {
      // Save cursor position before content update
      saveCursorPosition();
      setLocalContent(document.currentContent);
    }
  }, [document.currentContent]);

  // Restore cursor position after content update
  useEffect(() => {
    if (cursorPositionRef.current && editorRef.current) {
      requestAnimationFrame(() => {
        restoreCursorPosition();
      });
    }
  }, [localContent]);

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    
    const start = preCaretRange.toString().length;
    const end = start + range.toString().length;
    
    cursorPositionRef.current = { start, end };
    console.log('Saved cursor position:', { start, end });
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback(() => {
    if (!editorRef.current || !cursorPositionRef.current) return;

    const { start, end } = cursorPositionRef.current;
    const textNodes: Text[] = [];
    
    // Collect all text nodes
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    // Find the correct text node and offset for cursor position
    let currentLength = 0;
    let startNode: Text | null = null;
    let startOffset = 0;
    let endNode: Text | null = null;
    let endOffset = 0;
    
    for (const textNode of textNodes) {
      const nodeLength = textNode.textContent?.length || 0;
      
      if (!startNode && currentLength + nodeLength >= start) {
        startNode = textNode;
        startOffset = start - currentLength;
      }
      
      if (!endNode && currentLength + nodeLength >= end) {
        endNode = textNode;
        endOffset = end - currentLength;
        break;
      }
      
      currentLength += nodeLength;
    }
    
    if (startNode) {
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        
        range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        range.setEnd(endNode || startNode, Math.min(endOffset, (endNode || startNode).textContent?.length || 0));
        
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        console.log('Restored cursor position:', { start, end });
      } catch (error) {
        console.warn('Failed to restore cursor position:', error);
      }
    }
    
    // Clear the saved position
    cursorPositionRef.current = null;
  }, []);

  // Debounced save with reduced timeout for better responsiveness
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localContent !== document.currentContent) {
        console.log('Auto-saving content with preserved formatting');
        onContentChange(localContent);
      }
    }, 200); // Reduced from 500ms to 200ms for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [localContent, document.currentContent, onContentChange]);

  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    // Save cursor position before extracting content
    saveCursorPosition();
    
    // Extract content while preserving formatting
    const newContent = editorRef.current.innerText;
    setLocalContent(newContent);
  }, [saveCursorPosition]);

  // Convert content to HTML while preserving line breaks and formatting
  const formatContentForDisplay = useCallback((content: string) => {
    return content
      .replace(/\n/g, '<br>')
      .replace(/  /g, '&nbsp;&nbsp;'); // Preserve multiple spaces
  }, []);

  return (
    <div className="bg-gray-100 w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg p-16 relative">
          <div className="mb-4 text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
            <strong>Edit Mode:</strong> You can directly edit the document content below. Changes are auto-saved with cursor position preserved. Switch back to View mode to see redline suggestions.
          </div>
          <div
            ref={editorRef}
            contentEditable
            className={`w-full min-h-96 border-0 focus:outline-none bg-transparent whitespace-pre-wrap ${className}`}
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
            onInput={handleContentChange}
            onKeyDown={(e) => {
              // Save cursor position on key presses for better tracking
              if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                setTimeout(saveCursorPosition, 10);
              }
            }}
            dangerouslySetInnerHTML={{
              __html: formatContentForDisplay(localContent)
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EditableDocumentRenderer;
