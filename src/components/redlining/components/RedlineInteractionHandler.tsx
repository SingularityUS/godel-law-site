
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
 * 
 * Key Design Principles:
 * - Does NOT interfere with keyboard events or typing
 * - Only handles mouse clicks on specific redline elements
 * - Uses event delegation for performance with dynamic content
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
 * - DOES NOT interfere with keyboard events or typing
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
   * 6. Allow normal text selection and editing for regular content
   */
  const handleRedlineClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    console.log('RedlineInteractionHandler: Click detected on', target.tagName, target.className);
    
    // Handle accept button clicks (highest priority)
    const acceptBtn = target.closest('.redline-accept-btn');
    if (acceptBtn) {
      console.log('Accept button clicked');
      event.preventDefault();
      event.stopPropagation();
      const suggestionId = acceptBtn.getAttribute('data-suggestion-id');
      if (suggestionId && onSuggestionAccept) {
        onSuggestionAccept(suggestionId);
      }
      return;
    }

    // Handle suggestion element clicks (for selection/highlighting)
    const suggestionElement = target.closest('.redline-suggestion');
    if (suggestionElement) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
      if (suggestionId) {
        console.log('Suggestion element clicked:', suggestionId);
        onSuggestionClick(suggestionId);
        // Don't prevent default here - allow text selection within suggestions
      }
      return;
    }
    
    // For all other clicks (regular text), allow normal behavior
    console.log('Regular text click - allowing normal behavior');
  };

  return (
    <div onClick={handleRedlineClick}>
      {children}
    </div>
  );
};

export default RedlineInteractionHandler;
