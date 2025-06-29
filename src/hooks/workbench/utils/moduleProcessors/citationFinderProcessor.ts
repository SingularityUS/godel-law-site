
/**
 * Citation Finder Processor
 * 
 * Purpose: Detects Bluebook citations in legal text using ChatGPT analysis
 */

import { useChatGPTApi } from "../../useChatGPTApi";

export interface CitationFinding {
  id: string;
  type: 'case' | 'statute' | 'regulation' | 'secondary' | 'internal';
  originalText: string;
  startPos: number;
  endPos: number;
  paragraphId: string;
  isComplete: boolean;
  needsVerification: boolean;
  bluebookFormat?: string;
  parsed?: {
    caseName?: string;
    court?: string;
    year?: string;
    volume?: string;
    reporter?: string;
    page?: string;
  };
}

export interface CitationFinderResult {
  citations: CitationFinding[];
  totalCitations: number;
  processingStats: {
    paragraphsProcessed: number;
    citationsFound: number;
    averageCitationsPerParagraph: number;
  };
}

export const processCitationFinder = async (
  inputData: any,
  callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT'],
  onProgress?: (completed: number, total: number) => void
): Promise<{ output: CitationFinderResult; metadata: any }> => {
  console.log('=== CITATION FINDER PROCESSOR (FIXED POSITION CALCULATION) ===');
  console.log('Input data type:', typeof inputData);
  console.log('Input data keys:', inputData ? Object.keys(inputData) : 'null');
  
  // Extract paragraphs from input data - enhanced detection
  let paragraphs: any[] = [];
  
  // Check multiple possible data structures
  if (inputData && inputData.output && Array.isArray(inputData.output.paragraphs)) {
    paragraphs = inputData.output.paragraphs;
    console.log(`Found paragraphs in inputData.output: ${paragraphs.length} paragraphs`);
  } else if (inputData && Array.isArray(inputData.paragraphs)) {
    paragraphs = inputData.paragraphs;
    console.log(`Found paragraphs in inputData: ${paragraphs.length} paragraphs`);
  } else if (inputData && inputData.finalOutput && Array.isArray(inputData.finalOutput.paragraphs)) {
    paragraphs = inputData.finalOutput.paragraphs;
    console.log(`Found paragraphs in inputData.finalOutput: ${paragraphs.length} paragraphs`);
  } else if (Array.isArray(inputData)) {
    // If inputData itself is an array of paragraphs
    paragraphs = inputData;
    console.log(`Input data is directly an array: ${paragraphs.length} paragraphs`);
  } else {
    // Debug the actual structure
    console.warn('Citation finder: No paragraph data found');
    console.log('Full input data structure:', JSON.stringify(inputData, null, 2));
    
    return {
      output: {
        citations: [],
        totalCitations: 0,
        processingStats: {
          paragraphsProcessed: 0,
          citationsFound: 0,
          averageCitationsPerParagraph: 0
        }
      },
      metadata: {
        processingTime: Date.now(),
        method: 'citation-finder',
        error: 'No paragraph data available - connect Citation Finder to Paragraph Splitter output',
        userFriendlyError: 'Citation Finder needs paragraph data to analyze citations. Connect it to the Paragraph Splitter output.',
        citationAware: true,
        redliningReady: true,
        inputDataReceived: !!inputData,
        inputDataType: typeof inputData,
        availableKeys: inputData ? Object.keys(inputData) : []
      }
    };
  }
  
  const allCitations: CitationFinding[] = [];
  let globalPosition = 0;
  
  console.log('🎯 CITATION POSITION DEBUG: Starting global position calculation');
  console.log(`Processing ${paragraphs.length} paragraphs for citations`);
  
  // Process each paragraph for citations
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphContent = paragraph.content || '';
    
    if (onProgress) {
      onProgress(i, paragraphs.length);
    }
    
    console.log(`\n📍 PARAGRAPH ${i + 1}/${paragraphs.length} POSITION ANALYSIS:`);
    console.log(`Current global position: ${globalPosition}`);
    console.log(`Paragraph content length: ${paragraphContent.length}`);
    console.log(`Paragraph content preview: "${paragraphContent.substring(0, 100)}..."`);
    
    try {
      // Enhanced prompt with specific Bluebook citation examples
      const citationPrompt = `You are a legal citation expert. Analyze the following legal text and identify ALL Bluebook citations. Look for:

CASE CITATIONS: Brown v. Board of Educ., 347 U.S. 483 (1954)
STATUTE CITATIONS: 42 U.S.C. § 1983 (2018)
REGULATION CITATIONS: 29 C.F.R. § 1630.2(g) (2019)
SECONDARY SOURCES: Charles Alan Wright & Arthur R. Miller, Federal Practice and Procedure § 1057 (4th ed. 2008)
INTERNAL REFERENCES: See supra Part II.A; see infra note 45

Return ONLY a valid JSON object with this EXACT structure (no additional text before or after):

{
  "citations": [
    {
      "type": "case",
      "originalText": "exact citation text as it appears in the document",
      "startPos": 0,
      "endPos": 50,
      "isComplete": true,
      "needsVerification": false,
      "bluebookFormat": "properly formatted Bluebook citation",
      "parsed": {
        "caseName": "Brown v. Board of Education",
        "court": "U.S.",
        "year": "1954",
        "volume": "347",
        "reporter": "U.S.",
        "page": "483"
      }
    }
  ]
}

If no citations are found, return: {"citations": []}

Text to analyze:
${paragraphContent}`;

      console.log(`Sending citation analysis request for paragraph ${i + 1}`);
      const response = await callChatGPT(citationPrompt, '');
      
      // Fix: Extract the actual response content from the ChatGPT API result
      let responseText: string;
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object' && response.response) {
        responseText = response.response;
      } else if (response && typeof response === 'object' && response.data) {
        responseText = response.data;
      } else {
        console.warn(`Invalid response format for paragraph ${i + 1}:`, response);
        continue;
      }
      
      console.log(`ChatGPT response for paragraph ${i + 1}:`, responseText.substring(0, 200) + '...');
      
      let citationData;
      try {
        citationData = JSON.parse(responseText);
        console.log(`Parsed citation data for paragraph ${i + 1}:`, citationData);
      } catch (parseError) {
        console.warn(`Failed to parse citation response for paragraph ${i + 1}:`, parseError);
        console.warn(`Raw response was:`, responseText);
        
        // Try to extract JSON from response if it's wrapped in other text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            citationData = JSON.parse(jsonMatch[0]);
            console.log(`Successfully extracted JSON from wrapped response for paragraph ${i + 1}`);
          } catch (secondParseError) {
            console.warn(`Second parse attempt failed for paragraph ${i + 1}:`, secondParseError);
            continue;
          }
        } else {
          continue;
        }
      }
      
      if (citationData.citations && Array.isArray(citationData.citations)) {
        console.log(`🔍 PROCESSING ${citationData.citations.length} citations in paragraph ${i + 1}`);
        
        // Convert paragraph-relative positions to document-wide positions with FIXED logic
        const paragraphCitations = citationData.citations
          .map((citation: any, index: number) => {
            console.log(`\n⚡ CITATION ${index + 1} POSITION CALCULATION:`);
            console.log(`Looking for citation text: "${citation.originalText}"`);
            console.log(`Citation text length: ${citation.originalText?.length || 0}`);
            
            // CRITICAL FIX: Find the actual position of the citation within the paragraph
            const citationIndex = paragraphContent.indexOf(citation.originalText);
            console.log(`Citation index in paragraph: ${citationIndex}`);
            
            if (citationIndex === -1) {
              console.warn(`❌ CITATION NOT FOUND IN PARAGRAPH: "${citation.originalText}"`);
              console.warn(`Paragraph content: "${paragraphContent}"`);
              return null; // Skip this citation
            }
            
            // Calculate CORRECT global positions
            const actualGlobalStart = globalPosition + citationIndex;
            const actualGlobalEnd = actualGlobalStart + citation.originalText.length;
            
            console.log(`✅ CITATION POSITION CALCULATION COMPLETE:`);
            console.log(`  - Paragraph global start: ${globalPosition}`);
            console.log(`  - Citation index in paragraph: ${citationIndex}`);
            console.log(`  - Final global start: ${actualGlobalStart}`);
            console.log(`  - Final global end: ${actualGlobalEnd}`);
            console.log(`  - Citation text length: ${citation.originalText.length}`);
            console.log(`  - Calculated length: ${actualGlobalEnd - actualGlobalStart}`);
            
            // Validate the calculation by checking the text at the calculated position
            const expectedText = citation.originalText;
            console.log(`🔍 POSITION VALIDATION:`);
            console.log(`  - Expected text: "${expectedText}"`);
            console.log(`  - Text at calculated position would be checked during redline processing`);
            
            return {
              id: `cite-${i}-${index}`,
              type: citation.type || 'case',
              originalText: citation.originalText || '',
              startPos: actualGlobalStart,
              endPos: actualGlobalEnd,
              paragraphId: paragraph.id || `p${i}`,
              isComplete: citation.isComplete !== false, // Default to true if not specified
              needsVerification: citation.needsVerification === true, // Default to false if not specified
              bluebookFormat: citation.bluebookFormat,
              parsed: citation.parsed
            };
          })
          .filter(citation => citation !== null); // Remove invalid citations
        
        allCitations.push(...paragraphCitations);
        console.log(`📊 PARAGRAPH ${i + 1} SUMMARY:`);
        console.log(`  - Citations found: ${citationData.citations.length}`);
        console.log(`  - Valid citations: ${paragraphCitations.length}`);
        console.log(`  - Total citations so far: ${allCitations.length}`);
      } else {
        console.log(`No citations found in paragraph ${i + 1}`);
      }
      
    } catch (error) {
      console.error(`Error processing paragraph ${i + 1} for citations:`, error);
    }
    
    // CRITICAL: Update global position for next paragraph - CONSISTENT with content reconstruction
    globalPosition += paragraphContent.length + 2; // +2 for double newline paragraph separator
    console.log(`Updated global position to: ${globalPosition} after paragraph ${i + 1}`);
  }
  
  if (onProgress) {
    onProgress(paragraphs.length, paragraphs.length);
  }
  
  // Final validation of all citation positions
  console.log(`\n🎯 FINAL CITATION POSITION SUMMARY:`);
  allCitations.forEach((citation, index) => {
    console.log(`Citation ${index + 1}:`);
    console.log(`  - ID: ${citation.id}`);
    console.log(`  - Text: "${citation.originalText}"`);
    console.log(`  - Global position: ${citation.startPos} - ${citation.endPos}`);
    console.log(`  - Length: ${citation.endPos - citation.startPos} (expected: ${citation.originalText.length})`);
    console.log(`  - Length match: ${(citation.endPos - citation.startPos) === citation.originalText.length}`);
  });
  
  const result: CitationFinderResult = {
    citations: allCitations,
    totalCitations: allCitations.length,
    processingStats: {
      paragraphsProcessed: paragraphs.length,
      citationsFound: allCitations.length,
      averageCitationsPerParagraph: paragraphs.length > 0 ? allCitations.length / paragraphs.length : 0
    }
  };
  
  console.log(`\n✅ CITATION FINDER COMPLETE:`);
  console.log(`  - Total citations found: ${allCitations.length}`);
  console.log(`  - Paragraphs processed: ${paragraphs.length}`);
  console.log(`  - Position calculation method: FIXED - using actual indexOf results`);
  
  return {
    output: result,
    metadata: {
      processingTime: Date.now(),
      method: 'citation-finder',
      paragraphsProcessed: paragraphs.length,
      citationsFound: allCitations.length,
      citationAware: true,
      redliningReady: true,
      positionCalculationFixed: true
    }
  };
};
