
/**
 * Text Selection Utilities
 * 
 * Purpose: Handle text selection and position management for manual editing
 */

export interface TextRange {
  startPos: number;
  endPos: number;
  selectedText: string;
}

/**
 * Gets the text range for a clicked element
 */
export const getTextRangeFromClick = (
  target: HTMLElement, 
  containerElement: HTMLElement
): TextRange | null => {
  try {
    // Get the text content of the container
    const containerText = containerElement.textContent || '';
    
    // Find the clicked text node
    const walker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPos = 0;
    let clickedNode: Text | null = null;
    let nodeStartPos = 0;
    
    // Walk through text nodes to find the one containing our target
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const nodeLength = node.textContent?.length || 0;
      
      if (node.parentElement?.contains(target) || node.parentElement === target) {
        clickedNode = node;
        nodeStartPos = currentPos;
        break;
      }
      
      currentPos += nodeLength;
    }
    
    if (!clickedNode || !clickedNode.textContent) {
      return null;
    }
    
    // For now, select the entire text node or a word around the click
    const nodeText = clickedNode.textContent;
    const wordMatch = nodeText.match(/\S+/); // Find first word in the node
    
    if (wordMatch) {
      const wordStart = nodeStartPos + (wordMatch.index || 0);
      const wordEnd = wordStart + wordMatch[0].length;
      
      return {
        startPos: wordStart,
        endPos: wordEnd,
        selectedText: containerText.substring(wordStart, wordEnd)
      };
    }
    
    // Fallback: select the entire text node
    return {
      startPos: nodeStartPos,
      endPos: nodeStartPos + nodeText.length,
      selectedText: nodeText
    };
    
  } catch (error) {
    console.error('Error getting text range from click:', error);
    return null;
  }
};

/**
 * Replaces text at the specified range with new text
 */
export const replaceTextInRange = (
  content: string,
  range: TextRange,
  newText: string
): string => {
  const beforeText = content.substring(0, range.startPos);
  const afterText = content.substring(range.endPos);
  return beforeText + newText + afterText;
};

/**
 * Adjusts suggestion positions after manual text edits
 */
export const adjustSuggestionPositions = (
  suggestions: any[],
  editRange: TextRange,
  newText: string
): any[] => {
  const lengthDifference = newText.length - (editRange.endPos - editRange.startPos);
  
  return suggestions.map(suggestion => {
    // If suggestion is before the edit, no change needed
    if (suggestion.endPos <= editRange.startPos) {
      return suggestion;
    }
    
    // If suggestion is after the edit, shift positions
    if (suggestion.startPos >= editRange.endPos) {
      return {
        ...suggestion,
        startPos: suggestion.startPos + lengthDifference,
        endPos: suggestion.endPos + lengthDifference
      };
    }
    
    // If suggestion overlaps with the edit range, mark it as invalidated
    // (we'll handle this case by removing conflicting suggestions)
    return {
      ...suggestion,
      status: 'invalidated'
    };
  });
};
