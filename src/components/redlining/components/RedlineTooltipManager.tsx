
/**
 * RedlineTooltipManager Component
 * 
 * Purpose: Manages tooltip state and interactions for redline suggestions
 */

import React, { useState, useEffect } from "react";
import { RedlineSuggestion } from "@/types/redlining";
import RedlineSuggestionTooltip from "../RedlineSuggestionTooltip";

interface RedlineTooltipManagerProps {
  suggestions: RedlineSuggestion[];
  onSuggestionAction: (suggestionId: string, action: 'accepted' | 'rejected' | 'modified', newText?: string) => void;
  onNavigateToSuggestion: (suggestionId: string) => void;
  onShowSidebar: () => void;
}

interface TooltipState {
  suggestion: RedlineSuggestion | null;
  position: { x: number; y: number };
}

const RedlineTooltipManager: React.FC<RedlineTooltipManagerProps> = ({
  suggestions,
  onSuggestionAction,
  onNavigateToSuggestion,
  onShowSidebar
}) => {
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);

  const handleSuggestionClick = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      onNavigateToSuggestion(suggestionId);
      
      const handleMouseMove = (event: MouseEvent) => {
        setTooltipState({
          suggestion,
          position: { x: event.clientX, y: event.clientY }
        });
        window.document.removeEventListener('mousemove', handleMouseMove);
      };
      
      window.document.addEventListener('mousemove', handleMouseMove);
    }
  };

  const handleCloseTooltip = () => {
    setTooltipState(null);
  };

  const handleSuggestionActionWithTooltipClose = (suggestionId: string, action: 'accepted' | 'rejected' | 'modified', newText?: string) => {
    onSuggestionAction(suggestionId, action, newText);
    handleCloseTooltip();
  };

  const handleModifyAction = () => {
    if (tooltipState?.suggestion) {
      onShowSidebar();
      onNavigateToSuggestion(tooltipState.suggestion.id);
      handleCloseTooltip();
    }
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.redline-suggestion') && !target.closest('[data-tooltip]')) {
        handleCloseTooltip();
      }
    };

    if (tooltipState) {
      window.document.addEventListener('click', handleClickOutside);
      return () => window.document.removeEventListener('click', handleClickOutside);
    }
  }, [tooltipState]);

  return (
    <>
      {/* This component provides the click handler that should be attached to the document area */}
      {tooltipState && (
        <RedlineSuggestionTooltip
          suggestion={tooltipState.suggestion}
          position={tooltipState.position}
          onAccept={() => handleSuggestionActionWithTooltipClose(tooltipState.suggestion.id, 'accepted')}
          onReject={() => handleSuggestionActionWithTooltipClose(tooltipState.suggestion.id, 'rejected')}
          onModify={handleModifyAction}
        />
      )}
    </>
  );
};

export { RedlineTooltipManager };
export type { TooltipState };
export default RedlineTooltipManager;
