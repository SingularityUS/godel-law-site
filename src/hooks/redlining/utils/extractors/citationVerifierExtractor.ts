
/**
 * Citation Verifier Data Extractor
 * 
 * Purpose: Extracts verification data from citation verifier module output and merges with citation suggestions
 */

import { RedlineSuggestion } from "@/types/redlining";
import { CitationVerificationResult } from "@/hooks/workbench/utils/moduleProcessors/citationVerifierProcessor";

/**
 * Extract citation verification data and merge with existing citation suggestions
 */
export const extractCitationVerificationData = (
  moduleResult: any,
  sourceId: string
): { verificationResults: CitationVerificationResult[]; verificationStats: any } => {
  console.log('=== EXTRACTING CITATION VERIFICATION DATA ===');
  console.log('Module result structure:', {
    hasOutput: !!moduleResult.output,
    hasResult: !!moduleResult.result,
    hasDirectVerificationResults: !!moduleResult.verificationResults,
    keys: Object.keys(moduleResult || {})
  });
  
  let verificationData: CitationVerificationResult[] | null = null;
  let overallReport: any = null;
  
  // Find verification data - Check citation verifier output structure
  if (moduleResult.output?.verificationResults && Array.isArray(moduleResult.output.verificationResults)) {
    verificationData = moduleResult.output.verificationResults;
    overallReport = moduleResult.output.overallReport;
    console.log('Found verification results in moduleResult.output.verificationResults:', verificationData.length);
  } else if (moduleResult.result?.output?.verificationResults && Array.isArray(moduleResult.result.output.verificationResults)) {
    verificationData = moduleResult.result.output.verificationResults;
    overallReport = moduleResult.result.output.overallReport;
    console.log('Found verification results in moduleResult.result.output.verificationResults:', verificationData.length);
  } else if (moduleResult.verificationResults && Array.isArray(moduleResult.verificationResults)) {
    verificationData = moduleResult.verificationResults;
    overallReport = moduleResult.overallReport;
    console.log('Found verification results in moduleResult.verificationResults:', verificationData.length);
  }
  
  if (!verificationData || !Array.isArray(verificationData)) {
    console.warn('No verification data found or data is not an array');
    return { 
      verificationResults: [], 
      verificationStats: {
        totalCitations: 0,
        verifiedCount: 0,
        notFoundCount: 0,
        errorCount: 0,
        averageConfidence: 0
      }
    };
  }
  
  console.log(`🔍 CITATION VERIFICATION EXTRACTION: Processing ${verificationData.length} verification results`);
  
  // Log verification results for debugging
  verificationData.forEach((verification: CitationVerificationResult, index: number) => {
    console.log(`📍 VERIFICATION RESULT ${index + 1}:`, {
      citationId: verification.citationId,
      originalCitation: verification.originalCitation,
      verificationStatus: verification.verificationStatus,
      hasSourceUrl: !!verification.sourceUrl,
      verificationConfidence: verification.verificationConfidence,
      foundOnOfficialSite: verification.verificationDetails?.foundOnOfficialSite,
      searchSummary: verification.searchSummary?.substring(0, 100) + '...'
    });
  });
  
  const verificationStats = overallReport || {
    totalCitations: verificationData.length,
    verifiedCount: verificationData.filter(v => v.verificationStatus === 'verified' || v.verificationStatus === 'partially_verified').length,
    notFoundCount: verificationData.filter(v => v.verificationStatus === 'not_found').length,
    errorCount: verificationData.filter(v => v.verificationStatus === 'error').length,
    averageConfidence: verificationData.reduce((sum, v) => sum + (v.verificationConfidence || 0), 0) / verificationData.length
  };
  
  console.log(`📊 VERIFICATION EXTRACTION SUMMARY:`, {
    totalVerifications: verificationData.length,
    verifiedCount: verificationStats.verifiedCount,
    notFoundCount: verificationStats.notFoundCount,
    errorCount: verificationStats.errorCount,
    averageConfidence: verificationStats.averageConfidence?.toFixed(2)
  });
  
  return {
    verificationResults: verificationData,
    verificationStats
  };
};

/**
 * Merge verification data with existing citation suggestions
 */
export const mergeCitationVerificationData = (
  citationSuggestions: RedlineSuggestion[],
  verificationResults: CitationVerificationResult[]
): RedlineSuggestion[] => {
  console.log('=== MERGING CITATION VERIFICATION DATA ===');
  console.log(`Merging ${verificationResults.length} verification results with ${citationSuggestions.length} citation suggestions`);
  
  const mergedSuggestions = citationSuggestions.map(suggestion => {
    // Find matching verification result by citation text or ID
    const verification = verificationResults.find(v => 
      v.originalCitation === suggestion.originalText ||
      v.citationId === suggestion.id ||
      v.citationId.includes(suggestion.id) ||
      suggestion.id.includes(v.citationId)
    );
    
    if (verification) {
      console.log(`🔗 MERGING verification data for suggestion ${suggestion.id}:`, {
        verificationStatus: verification.verificationStatus,
        hasSourceUrl: !!verification.sourceUrl,
        confidence: verification.verificationConfidence
      });
      
      return {
        ...suggestion,
        sourceUrl: verification.sourceUrl,
        verificationStatus: verification.verificationStatus,
        verificationConfidence: verification.verificationConfidence,
        lastVerified: verification.lastVerified,
        alternativeUrls: verification.alternativeUrls,
        verificationDetails: verification.verificationDetails
      };
    } else {
      console.log(`❌ No verification data found for suggestion ${suggestion.id}`);
      return suggestion;
    }
  });
  
  console.log(`📊 MERGE SUMMARY:`, {
    totalSuggestions: citationSuggestions.length,
    mergedSuggestions: mergedSuggestions.filter(s => s.verificationStatus).length,
    unmergedSuggestions: mergedSuggestions.filter(s => !s.verificationStatus).length
  });
  
  return mergedSuggestions;
};
