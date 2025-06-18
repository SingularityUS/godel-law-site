
/**
 * RedlineInteractionHandler Component
 * 
 * Purpose: Manages user interactions with redline suggestions in the editor
 * 
 * Module Relationships:
 * - Used by: DirectEditableRenderer to handle redline-specific clicks
 * - Communicates with: Parent components via callback props
 * - Integrates with: RedlineStyles for visual feedback
 * - Depends on: DOM event handling and element traversal
 * 
 * Interaction Types:
 * 1. Accept Button Clicks - Quick approval of suggestions
 * 2. Suggestion Element Clicks - Selection and highlighting
 * 3. Event Delegation - Efficient handling of dynamic content
 */

import React from "react";

interface RedlineInteractionHandlerProps {
  /** Callback when a suggestion is clicked for selection */
  onSuggestionClick: (suggestionId: string) => void;
  /** Callback when accept button is clicked */
  onSuggestionAccept?: (suggestionId: string) => void;
  /** Children elements to wrap with interaction handling */
  children: React.ReactNode;
}

/**
 * Handles redline-specific interactions using event delegation
 * 
 * Event Delegation Pattern:
 * - Single click handler manages all redline interactions
 * - Uses DOM traversal to identify interaction targets
 * - Prevents event bubbling for redline-specific actions
 * - Maintains performance with dynamic content
 */
const RedlineInteractionHandler: React.FC<RedlineInteractionHandlerProps> = ({
  onSuggestionClick,
  onSuggestionAccept,
  children
}) => {
  
  /**
   * Unified click handler for all redline interactions
   * 
   * Event Flow:
   * 1. Check if click target is an accept button
   * 2. If accept button: extract suggestion ID and call accept handler
   * 3. If not accept button: check if click is on suggestion element
   * 4. If suggestion: extract ID and call selection handler
   * 5. Prevent event propagation for redline-specific clicks
   */
  const handleRedlineClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Handle accept button clicks (highest priority)
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

    // Handle suggestion element clicks
    const suggestionElement = target.closest('.redline-suggestion');
    if (suggestionElement) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
      if (suggestionId) {
        onSuggestionClick(suggestionId);
      }
      return;
    }
  };

  return (
    <div onClick={handleRedlineClick}>
      {children}
    </div>
  );
};

export default RedlineInteractionHandler;
