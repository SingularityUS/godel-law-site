
/**
 * Citation to Redline Converter
 * 
 * Purpose: Converts citation findings into redline suggestions for document highlighting
 */

import { RedlineSuggestion } from "@/types/redlining";
import { CitationFinding } from "@/hooks/workbench/utils/moduleProcessors/citationFinderProcessor";

/**
 * Converts citation findings to redline suggestions for highlighting
 */
export const convertCitationsToRedline = (
  citations: CitationFinding[],
  documentId: string = 'citation-analysis'
): RedlineSuggestion[] => {
  console.log(`Converting ${citations.length} citations to redline suggestions`);
  
  return citations.map((citation, index) => {
    // Determine severity based on citation completeness and verification needs
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (citation.needsVerification) {
      severity = 'medium';
    }
    if (!citation.isComplete) {
      severity = 'high';
    }
    
    // Create explanation based on citation type and status
    let explanation = `Bluebook citation detected: ${citation.type}`;
    if (citation.bluebookFormat && citation.bluebookFormat !== citation.originalText) {
      explanation += ` (Suggested format: ${citation.bluebookFormat})`;
    }
    if (citation.needsVerification) {
      explanation += ' - Requires verification';
    }
    if (!citation.isComplete) {
      explanation += ' - Incomplete citation';
    }
    
    // For complete citations, suggest the properly formatted version
    // For incomplete citations, suggest completion
    let suggestedText = citation.originalText;
    if (citation.bluebookFormat && citation.bluebookFormat !== citation.originalText) {
      suggestedText = citation.bluebookFormat;
    }
    
    const redlineSuggestion: RedlineSuggestion = {
      id: `citation-${documentId}-${index}`,
      type: 'legal',
      severity: severity,
      originalText: citation.originalText,
      suggestedText: suggestedText,
      explanation: explanation,
      startPos: citation.startPos,
      endPos: citation.endPos,
      paragraphId: citation.paragraphId,
      status: 'pending',
      confidence: citation.isComplete ? 0.9 : 0.7
    };
    
    return redlineSuggestion;
  });
};

/**
 * Groups citations by type for analysis summaries
 */
export const groupCitationsByType = (citations: CitationFinding[]) => {
  const groups = {
    case: [] as CitationFinding[],
    statute: [] as CitationFinding[],
    regulation: [] as CitationFinding[],
    secondary: [] as CitationFinding[],
    internal: [] as CitationFinding[]
  };
  
  citations.forEach(citation => {
    if (groups[citation.type]) {
      groups[citation.type].push(citation);
    }
  });
  
  return groups;
};

/**
 * Creates a summary of citation analysis for reporting
 */
export const createCitationSummary = (citations: CitationFinding[]) => {
  const groups = groupCitationsByType(citations);
  const incomplete = citations.filter(c => !c.isComplete);
  const needsVerification = citations.filter(c => c.needsVerification);
  
  return {
    totalCitations: citations.length,
    byType: {
      cases: groups.case.length,
      statutes: groups.statute.length,
      regulations: groups.regulation.length,
      secondary: groups.secondary.length,
      internal: groups.internal.length
    },
    qualityIssues: {
      incomplete: incomplete.length,
      needsVerification: needsVerification.length,
      percentComplete: citations.length > 0 ? ((citations.length - incomplete.length) / citations.length) * 100 : 100
    }
  };
};
