
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
  // Citation verification fields
  sourceUrl?: string;
  verificationStatus?: 'verified' | 'partially_verified' | 'not_found' | 'error';
  verificationConfidence?: number;
  lastVerified?: string;
  alternativeUrls?: string[];
  verificationDetails?: {
    foundOnOfficialSite: boolean;
    caseNameMatch: boolean;
    courtMatch: boolean;
    dateMatch: boolean;
    citationFormatCorrect: boolean;
  };
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
    sourceModules?: string[];
    verificationStats?: {
      totalCitationsVerified: number;
      verifiedCitations: number;
      notFoundCitations: number;
      errorCitations: number;
      averageVerificationConfidence: number;
    };
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
