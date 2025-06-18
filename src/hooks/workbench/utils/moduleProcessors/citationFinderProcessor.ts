
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
  console.log('=== CITATION FINDER PROCESSOR ===');
  
  // Extract paragraphs from input data
  let paragraphs: any[] = [];
  
  if (inputData && inputData.output && Array.isArray(inputData.output.paragraphs)) {
    paragraphs = inputData.output.paragraphs;
    console.log(`Processing ${paragraphs.length} paragraphs for citation detection`);
  } else if (Array.isArray(inputData.paragraphs)) {
    paragraphs = inputData.paragraphs;
    console.log(`Processing ${paragraphs.length} paragraphs for citation detection`);
  } else {
    console.warn('No paragraph data found for citation finder');
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
        error: 'No paragraph data available'
      }
    };
  }
  
  const allCitations: CitationFinding[] = [];
  let globalPosition = 0;
  
  // Process each paragraph for citations
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphContent = paragraph.content || '';
    
    if (onProgress) {
      onProgress(i, paragraphs.length);
    }
    
    console.log(`Analyzing paragraph ${i + 1}/${paragraphs.length} for citations`);
    
    try {
      // Create a specific prompt for citation detection
      const citationPrompt = `Analyze the following legal text and identify ALL Bluebook citations. Return ONLY a JSON object with this exact structure:

{
  "citations": [
    {
      "type": "case|statute|regulation|secondary|internal",
      "originalText": "exact citation text as it appears",
      "startPos": number (character position within this paragraph),
      "endPos": number (character position within this paragraph),
      "isComplete": boolean,
      "needsVerification": boolean,
      "bluebookFormat": "properly formatted Bluebook citation",
      "parsed": {
        "caseName": "if applicable",
        "court": "if applicable",
        "year": "if applicable",
        "volume": "if applicable",
        "reporter": "if applicable",
        "page": "if applicable"
      }
    }
  ]
}

Text to analyze:
${paragraphContent}`;

      const response = await callChatGPT(citationPrompt, '');
      
      let citationData;
      try {
        citationData = JSON.parse(response);
      } catch (parseError) {
        console.warn(`Failed to parse citation response for paragraph ${i + 1}:`, parseError);
        continue;
      }
      
      if (citationData.citations && Array.isArray(citationData.citations)) {
        // Convert paragraph-relative positions to document-wide positions
        const paragraphCitations = citationData.citations.map((citation: any, index: number) => ({
          id: `cite-${i}-${index}`,
          type: citation.type,
          originalText: citation.originalText,
          startPos: globalPosition + citation.startPos,
          endPos: globalPosition + citation.endPos,
          paragraphId: paragraph.id || `p${i}`,
          isComplete: citation.isComplete,
          needsVerification: citation.needsVerification,
          bluebookFormat: citation.bluebookFormat,
          parsed: citation.parsed
        }));
        
        allCitations.push(...paragraphCitations);
        console.log(`Found ${paragraphCitations.length} citations in paragraph ${i + 1}`);
      }
      
    } catch (error) {
      console.error(`Error processing paragraph ${i + 1} for citations:`, error);
    }
    
    // Update global position for next paragraph
    globalPosition += paragraphContent.length + 1; // +1 for paragraph break
  }
  
  if (onProgress) {
    onProgress(paragraphs.length, paragraphs.length);
  }
  
  const result: CitationFinderResult = {
    citations: allCitations,
    totalCitations: allCitations.length,
    processingStats: {
      paragraphsProcessed: paragraphs.length,
      citationsFound: allCitations.length,
      averageCitationsPerParagraph: paragraphs.length > 0 ? allCitations.length / paragraphs.length : 0
    }
  };
  
  console.log(`Citation finder complete: ${allCitations.length} citations found in ${paragraphs.length} paragraphs`);
  
  return {
    output: result,
    metadata: {
      processingTime: Date.now(),
      method: 'citation-finder',
      paragraphsProcessed: paragraphs.length,
      citationsFound: allCitations.length
    }
  };
};
