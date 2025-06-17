
/**
 * Response Parser Utility
 * 
 * Purpose: Parses JSON responses from ChatGPT with enhanced error handling and validation
 */

import { ModuleKind } from "@/data/modules";

export const parseJsonResponse = (response: string, moduleType: ModuleKind): any => {
  try {
    // Clean the response string
    let cleanedResponse = response.trim();
    
    // Remove any markdown code block formatting
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse the JSON
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate and enhance based on module type
    return validateAndEnhanceResponse(parsed, moduleType);
    
  } catch (error) {
    console.error(`Failed to parse JSON response for ${moduleType}:`, error);
    console.error('Raw response:', response);
    
    // Return a fallback structure to prevent pipeline failures
    return createFallbackResponse(response, moduleType);
  }
};

/**
 * Validates and enhances parsed JSON based on module type
 */
function validateAndEnhanceResponse(parsed: any, moduleType: ModuleKind): any {
  switch (moduleType) {
    case 'paragraph-splitter':
      return validateParagraphSplitterResponse(parsed);
    case 'grammar-checker':
      return validateGrammarCheckerResponse(parsed);
    case 'citation-finder':
      return validateCitationFinderResponse(parsed);
    case 'citation-verifier':
      return validateCitationVerifierResponse(parsed);
    case 'style-guide-enforcer':
      return validateStyleGuideResponse(parsed);
    default:
      return parsed;
  }
}

/**
 * Validates paragraph splitter response
 */
function validateParagraphSplitterResponse(parsed: any): any {
  if (!parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
    console.warn('Invalid paragraph splitter response: missing paragraphs array');
    return {
      paragraphs: [],
      totalParagraphs: 0,
      documentStructure: 'unknown',
      processingMetadata: {
        chunksProcessed: 0,
        contentLength: 0,
        estimatedReadingTime: 0
      }
    };
  }
  
  // Ensure each paragraph has required fields
  const validatedParagraphs = parsed.paragraphs.map((p: any, index: number) => ({
    id: p.id || `p${index + 1}`,
    type: p.type || 'body',
    sectionNumber: p.sectionNumber || '',
    content: p.content || '',
    containsCitations: Boolean(p.containsCitations),
    isNumbered: Boolean(p.isNumbered)
  }));
  
  return {
    paragraphs: validatedParagraphs,
    totalParagraphs: validatedParagraphs.length,
    documentStructure: parsed.documentStructure || 'unknown',
    processingMetadata: {
      chunksProcessed: parsed.processingMetadata?.chunksProcessed || 0,
      contentLength: parsed.processingMetadata?.contentLength || 0,
      estimatedReadingTime: parsed.processingMetadata?.estimatedReadingTime || 0
    }
  };
}

/**
 * Validates grammar checker response
 */
function validateGrammarCheckerResponse(parsed: any): any {
  if (!parsed.analysis || !Array.isArray(parsed.analysis)) {
    console.warn('Invalid grammar checker response: missing analysis array');
    return {
      analysis: [],
      overallAssessment: {
        totalParagraphs: 0,
        totalErrors: 0,
        writingQuality: 'unknown',
        recommendations: []
      }
    };
  }
  
  // Validate analysis entries
  const validatedAnalysis = parsed.analysis.map((item: any) => ({
    paragraphId: item.paragraphId || '',
    original: item.original || '',
    suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
    corrected: item.corrected || item.original || '',
    legalWritingScore: Math.max(1, Math.min(10, Number(item.legalWritingScore) || 5)),
    improvementSummary: item.improvementSummary || ''
  }));
  
  return {
    analysis: validatedAnalysis,
    overallAssessment: {
      totalParagraphs: validatedAnalysis.length,
      totalErrors: parsed.overallAssessment?.totalErrors || 0,
      writingQuality: parsed.overallAssessment?.writingQuality || 'unknown',
      recommendations: Array.isArray(parsed.overallAssessment?.recommendations) 
        ? parsed.overallAssessment.recommendations 
        : [],
      processingMetadata: {
        paragraphsAnalyzed: validatedAnalysis.length,
        averageScore: validatedAnalysis.reduce((sum: number, p: any) => sum + p.legalWritingScore, 0) / validatedAnalysis.length || 0,
        totalSuggestions: validatedAnalysis.reduce((sum: number, p: any) => sum + p.suggestions.length, 0)
      }
    }
  };
}

/**
 * Validates citation finder response
 */
function validateCitationFinderResponse(parsed: any): any {
  const citations = Array.isArray(parsed.citations) ? parsed.citations : [];
  
  return {
    citations: citations.map((c: any, index: number) => ({
      id: c.id || `cite${index + 1}`,
      type: c.type || 'unknown',
      text: c.text || '',
      parsed: c.parsed || {},
      location: c.location || '',
      isComplete: Boolean(c.isComplete),
      needsVerification: Boolean(c.needsVerification),
      bluebookFormat: c.bluebookFormat || ''
    })),
    summary: {
      totalCitations: citations.length,
      caseCount: citations.filter((c: any) => c.type === 'case').length,
      statuteCount: citations.filter((c: any) => c.type === 'statute').length,
      incompleteCount: citations.filter((c: any) => !c.isComplete).length
    }
  };
}

/**
 * Validates citation verifier response
 */
function validateCitationVerifierResponse(parsed: any): any {
  const results = Array.isArray(parsed.verificationResults) ? parsed.verificationResults : [];
  
  return {
    verificationResults: results.map((r: any) => ({
      citationId: r.citationId || '',
      originalCitation: r.originalCitation || '',
      status: r.status || 'cannot_verify',
      issues: Array.isArray(r.issues) ? r.issues : [],
      correctedCitation: r.correctedCitation || r.originalCitation || '',
      confidence: Math.max(1, Math.min(10, Number(r.confidence) || 1)),
      lastVerified: r.lastVerified || new Date().toISOString()
    })),
    overallReport: {
      totalVerified: results.filter((r: any) => r.status === 'verified').length,
      needsCorrection: results.filter((r: any) => r.status === 'needs_correction').length,
      cannotVerify: results.filter((r: any) => r.status === 'cannot_verify').length,
      recommendManualReview: Array.isArray(parsed.overallReport?.recommendManualReview) 
        ? parsed.overallReport.recommendManualReview 
        : []
    }
  };
}

/**
 * Validates style guide response
 */
function validateStyleGuideResponse(parsed: any): any {
  const analysis = Array.isArray(parsed.styleAnalysis) ? parsed.styleAnalysis : [];
  
  return {
    styleAnalysis: analysis.map((s: any) => ({
      section: s.section || '',
      violations: Array.isArray(s.violations) ? s.violations : [],
      complianceScore: Math.max(1, Math.min(10, Number(s.complianceScore) || 5))
    })),
    summary: {
      overallCompliance: Math.max(1, Math.min(10, Number(parsed.summary?.overallCompliance) || 5)),
      totalViolations: parsed.summary?.totalViolations || 0,
      majorIssues: parsed.summary?.majorIssues || 0,
      recommendations: Array.isArray(parsed.summary?.recommendations) 
        ? parsed.summary.recommendations 
        : [],
      styleGuideUsed: parsed.summary?.styleGuideUsed || 'Unknown'
    }
  };
}

/**
 * Creates fallback response when parsing fails
 */
function createFallbackResponse(originalResponse: string, moduleType: ModuleKind): any {
  const fallback = {
    error: 'Failed to parse JSON response',
    originalResponse: originalResponse.substring(0, 500) + '...',
    moduleType
  };
  
  switch (moduleType) {
    case 'paragraph-splitter':
      return {
        ...fallback,
        paragraphs: [],
        totalParagraphs: 0,
        documentStructure: 'error'
      };
    case 'grammar-checker':
      return {
        ...fallback,
        analysis: [],
        overallAssessment: {
          totalParagraphs: 0,
          totalErrors: 0,
          writingQuality: 'error',
          recommendations: ['Please review the raw response for parsing errors']
        }
      };
    default:
      return fallback;
  }
}
