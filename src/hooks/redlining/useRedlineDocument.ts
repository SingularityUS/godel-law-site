
/**
 * useRedlineDocument Hook
 * 
 * Purpose: Manages redlining document state and actions
 */

import { useState, useCallback, useMemo } from "react";
import { RedlineDocument, RedlineState, RedlineSuggestion } from "@/types/redlining";

export const useRedlineDocument = (initialDocument: RedlineDocument) => {
  const [document, setDocument] = useState<RedlineDocument>(initialDocument);
  const [redlineState, setRedlineState] = useState<RedlineState>({
    document: initialDocument,
    selectedSuggestionId: null,
    filterType: 'all',
    filterSeverity: 'all',
    showAccepted: false,
    showRejected: false,
    currentSuggestionIndex: 0
  });

  /**
   * Handle suggestion actions (accept, reject, modify)
   */
  const handleSuggestionAction = useCallback((
    suggestionId: string,
    action: 'accepted' | 'rejected' | 'modified',
    newText?: string
  ) => {
    setDocument(prev => {
      const suggestions = prev.suggestions.map(suggestion => {
        if (suggestion.id === suggestionId) {
          const updatedSuggestion = {
            ...suggestion,
            status: action,
            ...(newText && action === 'modified' ? { suggestedText: newText } : {})
          };
          
          return updatedSuggestion;
        }
        return suggestion;
      });

      // Apply the change to the document content if accepted
      let currentContent = prev.currentContent;
      if (action === 'accepted' || action === 'modified') {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          const textToUse = action === 'modified' && newText ? newText : suggestion.suggestedText;
          currentContent = currentContent.substring(0, suggestion.startPos) +
                          textToUse +
                          currentContent.substring(suggestion.endPos);
        }
      }

      return {
        ...prev,
        suggestions,
        currentContent,
        metadata: {
          ...prev.metadata,
          lastModified: new Date().toISOString(),
          acceptedSuggestions: suggestions.filter(s => s.status === 'accepted').length,
          rejectedSuggestions: suggestions.filter(s => s.status === 'rejected').length
        }
      };
    });
  }, []);

  /**
   * Navigate to a specific suggestion
   */
  const navigateToSuggestion = useCallback((suggestionId: string | 'next' | 'prev') => {
    if (suggestionId === 'next' || suggestionId === 'prev') {
      const pendingSuggestions = document.suggestions.filter(s => s.status === 'pending');
      const currentIndex = redlineState.currentSuggestionIndex;
      
      let newIndex;
      if (suggestionId === 'next') {
        newIndex = Math.min(currentIndex + 1, pendingSuggestions.length - 1);
      } else {
        newIndex = Math.max(currentIndex - 1, 0);
      }
      
      setRedlineState(prev => ({
        ...prev,
        currentSuggestionIndex: newIndex,
        selectedSuggestionId: pendingSuggestions[newIndex]?.id || null
      }));
    } else {
      setRedlineState(prev => ({
        ...prev,
        selectedSuggestionId: suggestionId
      }));
    }
  }, [document.suggestions, redlineState.currentSuggestionIndex]);

  /**
   * Apply filters to suggestions
   */
  const applyFilters = useCallback((filters: Partial<RedlineState>) => {
    setRedlineState(prev => ({
      ...prev,
      ...filters
    }));
  }, []);

  /**
   * Get filtered suggestions based on current state
   */
  const filteredSuggestions = useMemo(() => {
    return document.suggestions.filter(suggestion => {
      // Type filter
      if (redlineState.filterType !== 'all' && suggestion.type !== redlineState.filterType) {
        return false;
      }
      
      // Severity filter
      if (redlineState.filterSeverity !== 'all' && suggestion.severity !== redlineState.filterSeverity) {
        return false;
      }
      
      // Status filter
      if (!redlineState.showAccepted && suggestion.status === 'accepted') {
        return false;
      }
      
      if (!redlineState.showRejected && suggestion.status === 'rejected') {
        return false;
      }
      
      return true;
    });
  }, [document.suggestions, redlineState]);

  /**
   * Get current document state
   */
  const getCurrentDocument = useCallback(() => document, [document]);

  return {
    redlineState,
    document,
    handleSuggestionAction,
    navigateToSuggestion,
    applyFilters,
    filteredSuggestions,
    getCurrentDocument
  };
};
