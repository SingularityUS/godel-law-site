
/**
 * Redlining Types
 * 
 * Purpose: Type definitions for document redlining functionality
 */

export interface RedlineSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'legal' | 'clarity';
  severity: 'low' | 'medium' | 'high';
  originalText: string;
  suggestedText: string;
  explanation: string;
  startPos: number;
  endPos: number;
  paragraphId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  confidence?: number;
}

export interface RedlineDocument {
  id: string;
  originalContent: string;
  currentContent: string;
  suggestions: RedlineSuggestion[];
  metadata: {
    fileName: string;
    fileType: string;
    lastModified: string;
    totalSuggestions: number;
    acceptedSuggestions: number;
    rejectedSuggestions: number;
  };
  positionMap?: any;
}

export interface RedlineState {
  document: RedlineDocument | null;
  selectedSuggestionId: string | null;
  filterType: 'all' | 'grammar' | 'style' | 'legal' | 'clarity';
  filterSeverity: 'all' | 'low' | 'medium' | 'high';
  showAccepted: boolean;
  showRejected: boolean;
  currentSuggestionIndex: number;
}
