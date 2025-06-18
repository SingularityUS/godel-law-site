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
   * Auto-save document with debouncing
   */
  const autoSave = useCallback((updatedDocument: RedlineDocument) => {
    // Simulate auto-save delay
    setTimeout(() => {
      console.log('Document auto-saved');
      // In a real app, this would call an API to save the document
    }, 500);
  }, []);

  /**
   * Update the entire document
   */
  const updateDocument = useCallback((updatedDocument: RedlineDocument) => {
    console.log('Updating document with new content');
    setDocument(updatedDocument);
    setRedlineState(prev => ({
      ...prev,
      document: updatedDocument
    }));
    
    // Trigger auto-save
    autoSave(updatedDocument);
  }, [autoSave]);

  /**
   * Handle suggestion actions (accept, reject, modify) with auto-save
   */
  const handleSuggestionAction = useCallback((
    suggestionId: string,
    action: 'accepted' | 'rejected' | 'modified',
    newText?: string
  ) => {
    console.log(`Handling suggestion action: ${action} for suggestion ${suggestionId}`);
    
    try {
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

        // Apply the change to the document content if accepted or modified
        let currentContent = prev.currentContent;
        if (action === 'accepted' || action === 'modified') {
          const suggestion = suggestions.find(s => s.id === suggestionId);
          if (suggestion && suggestion.startPos !== undefined && suggestion.endPos !== undefined) {
            const textToUse = action === 'modified' && newText ? newText : suggestion.suggestedText;
            currentContent = currentContent.substring(0, suggestion.startPos) +
                            textToUse +
                            currentContent.substring(suggestion.endPos);
          }
        }

        const updatedDocument = {
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

        // Trigger auto-save
        autoSave(updatedDocument);
        
        return updatedDocument;
      });
    } catch (error) {
      console.error('Error handling suggestion action:', error);
    }
  }, [autoSave]);

  /**
   * Quick accept suggestion (for checkmark button)
   */
  const acceptSuggestion = useCallback((suggestionId: string) => {
    handleSuggestionAction(suggestionId, 'accepted');
  }, [handleSuggestionAction]);

  /**
   * Modify suggestion with custom text (for inline editing)
   */
  const modifySuggestion = useCallback((suggestionId: string, newText: string) => {
    handleSuggestionAction(suggestionId, 'modified', newText);
  }, [handleSuggestionAction]);

  /**
   * Navigate to a specific suggestion
   */
  const navigateToSuggestion = useCallback((suggestionId: string | 'next' | 'prev') => {
    try {
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
    } catch (error) {
      console.error('Error navigating to suggestion:', error);
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
    try {
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
    } catch (error) {
      console.error('Error filtering suggestions:', error);
      return [];
    }
  }, [document.suggestions, redlineState]);

  /**
   * Get current document state
   */
  const getCurrentDocument = useCallback(() => document, [document]);

  return {
    redlineState,
    document,
    handleSuggestionAction,
    acceptSuggestion,
    modifySuggestion,
    navigateToSuggestion,
    applyFilters,
    filteredSuggestions,
    getCurrentDocument,
    updateDocument
  };
};
