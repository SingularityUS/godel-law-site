/**
 * Citation Verifier Processor
 * 
 * Purpose: Verifies legal citations using ChatGPT web search to find sources online
 */

import { useChatGPTApi } from "../../useChatGPTApi";

export interface CitationVerificationResult {
  citationId: string;
  originalCitation: string;
  verificationStatus: 'verified' | 'partially_verified' | 'not_found' | 'error';
  sourceUrl?: string;
  alternativeUrls?: string[];
  verificationConfidence: number;
  verificationDetails: {
    foundOnOfficialSite: boolean;
    caseNameMatch: boolean;
    courtMatch: boolean;
    dateMatch: boolean;
    citationFormatCorrect: boolean;
  };
  suggestedCorrections?: {
    correctedCitation?: string;
    notes?: string;
  };
  lastVerified: string;
  searchSummary: string;
}

export interface CitationVerifierResult {
  verificationResults: CitationVerificationResult[];
  overallReport: {
    totalCitations: number;
    verifiedCount: number;
    notFoundCount: number;
    errorCount: number;
    averageConfidence: number;
    recommendationsForReview: string[];
  };
}

export const processCitationVerifier = async (
  inputData: any,
  callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT'],
  onProgress?: (completed: number, total: number) => void
): Promise<{ output: CitationVerifierResult; metadata: any }> => {
  console.log('=== CITATION VERIFIER PROCESSOR (WEB SEARCH) ===');
  console.log('Input data type:', typeof inputData);
  console.log('Input data keys:', inputData ? Object.keys(inputData) : 'null');
  
  // Extract citations from input data (from citation-finder output)
  let citations: any[] = [];
  
  // Check multiple possible data structures from citation-finder
  if (inputData && inputData.output && Array.isArray(inputData.output.citations)) {
    citations = inputData.output.citations;
    console.log(`Found citations in inputData.output: ${citations.length} citations`);
  } else if (inputData && Array.isArray(inputData.citations)) {
    citations = inputData.citations;
    console.log(`Found citations in inputData: ${citations.length} citations`);
  } else if (inputData && inputData.finalOutput && Array.isArray(inputData.finalOutput.citations)) {
    citations = inputData.finalOutput.citations;
    console.log(`Found citations in inputData.finalOutput: ${citations.length} citations`);
  } else {
    console.warn('Citation verifier: No citation data found');
    console.log('Full input data structure:', JSON.stringify(inputData, null, 2));
    
    return {
      output: {
        verificationResults: [],
        overallReport: {
          totalCitations: 0,
          verifiedCount: 0,
          notFoundCount: 0,
          errorCount: 0,
          averageConfidence: 0,
          recommendationsForReview: []
        }
      },
      metadata: {
        processingTime: Date.now(),
        method: 'citation-verifier',
        error: 'No citation data available - connect Citation Verifier to Citation Finder output',
        userFriendlyError: 'Citation Verifier needs citation data to verify. Connect it to the Citation Finder output.',
        webSearchEnabled: true,
        verificationReady: true,
        inputDataReceived: !!inputData,
        inputDataType: typeof inputData,
        availableKeys: inputData ? Object.keys(inputData) : []
      }
    };
  }
  
  const verificationResults: CitationVerificationResult[] = [];
  let verifiedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  const confidenceScores: number[] = [];
  
  console.log(`🔍 CITATION VERIFICATION: Processing ${citations.length} citations with web search`);
  
  // Process each citation for verification
  for (let i = 0; i < citations.length; i++) {
    const citation = citations[i];
    
    if (onProgress) {
      onProgress(i, citations.length);
    }
    
    console.log(`\n📍 VERIFYING CITATION ${i + 1}/${citations.length}:`);
    console.log(`Citation text: "${citation.originalText || citation.text}"`);
    console.log(`Citation type: ${citation.type}`);
    
    try {
      // Enhanced prompt for web search citation verification
      const verificationPrompt = `You are a legal citation verification specialist with web search access. Use web search to verify this legal citation and find its authoritative source online.

CITATION TO VERIFY:
${citation.originalText || citation.text}

CITATION TYPE: ${citation.type || 'unknown'}

VERIFICATION TASKS:
1. Search the web for this exact citation
2. Look for the citation on official court websites, legal databases (Justia, Google Scholar, etc.)
3. Verify the citation format follows Bluebook standards
4. Find the most authoritative source URL for this citation
5. Assess the reliability and accuracy of the citation

Return ONLY a valid JSON object with this EXACT structure (no additional text):

{
  "citationId": "${citation.id || `cite-${i}`}",
  "originalCitation": "${citation.originalText || citation.text}",
  "verificationStatus": "verified|partially_verified|not_found|error",
  "sourceUrl": "direct URL to the source document if found",
  "alternativeUrls": ["array of additional relevant URLs found"],
  "verificationConfidence": 0.95,
  "verificationDetails": {
    "foundOnOfficialSite": true,
    "caseNameMatch": true,
    "courtMatch": true,
    "dateMatch": true,
    "citationFormatCorrect": true
  },
  "suggestedCorrections": {
    "correctedCitation": "if format needs correction",
    "notes": "explanation of any issues found"
  },
  "lastVerified": "${new Date().toISOString()}",
  "searchSummary": "brief summary of what was found during web search"
}

IMPORTANT: Use web search to find actual sources. If the citation cannot be found, set verificationStatus to "not_found" and explain why in searchSummary.`;

      console.log(`Sending verification request for citation ${i + 1}`);
      // Fix: Use correct function signature - callChatGPT(prompt, systemPrompt, model, maxTokens)
      const response = await callChatGPT(verificationPrompt, '', 'gpt-4o-mini', 3000);
      
      // Extract response content
      let responseText: string;
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object' && response.response) {
        responseText = response.response;
      } else if (response && typeof response === 'object' && response.data) {
        responseText = response.data;
      } else {
        console.warn(`Invalid response format for citation ${i + 1}:`, response);
        errorCount++;
        continue;
      }
      
      console.log(`ChatGPT verification response for citation ${i + 1}:`, responseText.substring(0, 200) + '...');
      
      let verificationData;
      try {
        verificationData = JSON.parse(responseText);
        console.log(`Parsed verification data for citation ${i + 1}:`, verificationData);
      } catch (parseError) {
        console.warn(`Failed to parse verification response for citation ${i + 1}:`, parseError);
        console.warn(`Raw response was:`, responseText);
        
        // Try to extract JSON from response if it's wrapped
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            verificationData = JSON.parse(jsonMatch[0]);
            console.log(`Successfully extracted JSON from wrapped response for citation ${i + 1}`);
          } catch (secondParseError) {
            console.warn(`Second parse attempt failed for citation ${i + 1}:`, secondParseError);
            errorCount++;
            continue;
          }
        } else {
          errorCount++;
          continue;
        }
      }
      
      // Validate and clean verification data
      const result: CitationVerificationResult = {
        citationId: verificationData.citationId || citation.id || `cite-${i}`,
        originalCitation: verificationData.originalCitation || citation.originalText || citation.text,
        verificationStatus: verificationData.verificationStatus || 'error',
        sourceUrl: verificationData.sourceUrl,
        alternativeUrls: verificationData.alternativeUrls || [],
        verificationConfidence: Math.min(Math.max(verificationData.verificationConfidence || 0, 0), 1),
        verificationDetails: {
          foundOnOfficialSite: verificationData.verificationDetails?.foundOnOfficialSite || false,
          caseNameMatch: verificationData.verificationDetails?.caseNameMatch || false,
          courtMatch: verificationData.verificationDetails?.courtMatch || false,
          dateMatch: verificationData.verificationDetails?.dateMatch || false,
          citationFormatCorrect: verificationData.verificationDetails?.citationFormatCorrect || false
        },
        suggestedCorrections: verificationData.suggestedCorrections,
        lastVerified: verificationData.lastVerified || new Date().toISOString(),
        searchSummary: verificationData.searchSummary || 'No search summary available'
      };
      
      // Update counts based on verification status
      switch (result.verificationStatus) {
        case 'verified':
        case 'partially_verified':
          verifiedCount++;
          break;
        case 'not_found':
          notFoundCount++;
          break;
        case 'error':
        default:
          errorCount++;
          break;
      }
      
      confidenceScores.push(result.verificationConfidence);
      verificationResults.push(result);
      
      console.log(`✅ VERIFICATION COMPLETE FOR CITATION ${i + 1}:`, {
        status: result.verificationStatus,
        confidence: result.verificationConfidence,
        hasSourceUrl: !!result.sourceUrl,
        alternativeUrlsCount: result.alternativeUrls?.length || 0
      });
      
    } catch (error) {
      console.error(`Error verifying citation ${i + 1}:`, error);
      errorCount++;
      
      // Create error result
      const errorResult: CitationVerificationResult = {
        citationId: citation.id || `cite-${i}`,
        originalCitation: citation.originalText || citation.text,
        verificationStatus: 'error',
        verificationConfidence: 0,
        verificationDetails: {
          foundOnOfficialSite: false,
          caseNameMatch: false,
          courtMatch: false,
          dateMatch: false,
          citationFormatCorrect: false
        },
        lastVerified: new Date().toISOString(),
        searchSummary: `Verification failed: ${error.message || 'Unknown error'}`
      };
      
      verificationResults.push(errorResult);
    }
  }
  
  if (onProgress) {
    onProgress(citations.length, citations.length);
  }
  
  // Calculate average confidence
  const averageConfidence = confidenceScores.length > 0 
    ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
    : 0;
  
  // Identify citations needing manual review
  const recommendationsForReview = verificationResults
    .filter(result => 
      result.verificationStatus === 'error' || 
      result.verificationStatus === 'not_found' ||
      (result.verificationStatus === 'partially_verified' && result.verificationConfidence < 0.7)
    )
    .map(result => result.originalCitation);
  
  const finalResult: CitationVerifierResult = {
    verificationResults,
    overallReport: {
      totalCitations: citations.length,
      verifiedCount,
      notFoundCount,
      errorCount,
      averageConfidence,
      recommendationsForReview
    }
  };
  
  console.log(`\n✅ CITATION VERIFICATION COMPLETE:`, {
    totalCitations: citations.length,
    verifiedCount,
    notFoundCount,
    errorCount,
    averageConfidence: averageConfidence.toFixed(2),
    recommendationsCount: recommendationsForReview.length
  });
  
  return {
    output: finalResult,
    metadata: {
      processingTime: Date.now(),
      method: 'citation-verifier',
      citationsProcessed: citations.length,
      webSearchEnabled: true,
      verificationStats: {
        verified: verifiedCount,
        notFound: notFoundCount,
        errors: errorCount,
        averageConfidence
      }
    }
  };
};
