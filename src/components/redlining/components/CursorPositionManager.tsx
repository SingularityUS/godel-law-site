
/**
 * CursorPositionManager Utility
 * 
 * Purpose: Manages cursor position restoration after programmatic content updates
 * 
 * Module Relationships:
 * - Used by: DirectEditableRenderer during content updates
 * - Depends on: Browser's Selection API and TreeWalker API
 * - Integrates with: ContentEditable elements for cursor management
 * 
 * Technical Challenge:
 * When we programmatically update HTML content (like adding redline markup),
 * the browser loses the cursor position. This utility preserves and restores
 * the cursor to maintain a seamless editing experience.
 */

/**
 * Calculates the current cursor position as a character offset from the start
 * 
 * Algorithm:
 * 1. Gets current selection range
 * 2. Creates a range from start of container to cursor position
 * 3. Measures text length to calculate character offset
 * 
 * @param container The contentEditable container element
 * @returns Character offset from start, or 0 if no selection
 */
export const getCurrentCursorPosition = (container: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return 0;
  
  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer)) return 0;
  
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(container);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  
  return preCaretRange.toString().length;
};

/**
 * Restores cursor position to a specific character offset
 * 
 * Algorithm:
 * 1. Uses TreeWalker to traverse all text nodes
 * 2. Accumulates character count until reaching target position
 * 3. Sets selection range at the calculated position
 * 4. Handles edge cases like position beyond content length
 * 
 * @param container The contentEditable container element
 * @param position Character offset where cursor should be placed
 */
export const restoreCursorPosition = (container: HTMLElement, position: number): void => {
  if (position <= 0) return;
  
  try {
    const walker = window.document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPos = 0;
    let textNode = walker.nextNode() as Text;
    
    while (textNode) {
      const nodeLength = textNode.textContent?.length || 0;
      
      // Found the target position within this text node
      if (currentPos + nodeLength >= position) {
        const offset = position - currentPos;
        const newRange = window.document.createRange();
        newRange.setStart(textNode, Math.min(offset, nodeLength));
        newRange.collapse(true);
        
        const selection = window.getSelection();
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
};

/**
 * Hook for managing cursor position during content updates
 * 
 * Usage Pattern:
 * 1. Call saveCursorPosition() before updating content
 * 2. Update the HTML content
 * 3. Call restoreCursorPosition() to restore cursor
 * 
 * @param containerRef Reference to the contentEditable container
 */
export const useCursorPositionManager = (containerRef: React.RefObject<HTMLElement>) => {
  let savedPosition = 0;
  
  const saveCursorPosition = () => {
    if (containerRef.current) {
      savedPosition = getCurrentCursorPosition(containerRef.current);
    }
  };
  
  const restoreCursor = () => {
    if (containerRef.current && savedPosition > 0) {
      restoreCursorPosition(containerRef.current, savedPosition);
    }
  };
  
  return { saveCursorPosition, restoreCursor };
};
