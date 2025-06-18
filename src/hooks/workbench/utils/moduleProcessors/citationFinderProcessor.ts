
/**
 * Citation Finder Processor
 * 
 * Purpose: Handles citation finding with Bluebook style detection and redline integration
 */

import { HelperNode } from "@/types/workbench";
import { useChatGPTApi } from "../../useChatGPTApi";

export interface CitationMatch {
  id: string;
  type: 'case' | 'statute' | 'regulation' | 'secondary' | 'internal';
  text: string;
  startPos: number;
  endPos: number;
  isComplete: boolean;
  needsVerification: boolean;
  bluebookFormat: string;
  parsed?: {
    caseName?: string;
    court?: string;
    year?: string;
    volume?: string;
    reporter?: string;
    page?: string;
  };
  location: string;
}

export interface CitationFinderOutput {
  citations: CitationMatch[];
  summary: {
    totalCitations: number;
    caseCount: number;
    statuteCount: number;
    incompleteCount: number;
  };
  redlineSuggestions: Array<{
    id: string;
    type: 'citation-highlight';
    startPos: number;
    endPos: number;
    originalText: string;
    suggestedText: string;
    explanation: string;
    severity: 'info';
    status: 'pending';
  }>;
}

export const createCitationFinderProcessor = (callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']) => {
  return async (
    node: HelperNode,
    inputData: any,
    systemPrompt: string,
    moduleType: string
  ) => {
    console.log('=== CITATION FINDER PROCESSOR ===');
    console.log('Input data structure:', typeof inputData, inputData ? Object.keys(inputData) : 'null');
    
    // Extract text content from various input formats
    let textContent = '';
    let paragraphs: any[] = [];
    
    if (inputData?.output?.paragraphs && Array.isArray(inputData.output.paragraphs)) {
      // From paragraph splitter output
      paragraphs = inputData.output.paragraphs;
      textContent = paragraphs.map(p => p.content || p.text || '').join('\n\n');
      console.log(`Processing ${paragraphs.length} paragraphs from paragraph splitter`);
    } else if (inputData?.paragraphs && Array.isArray(inputData.paragraphs)) {
      // Direct paragraphs array
      paragraphs = inputData.paragraphs;
      textContent = paragraphs.map(p => p.content || p.text || '').join('\n\n');
      console.log(`Processing ${paragraphs.length} paragraphs directly`);
    } else if (inputData?.content && typeof inputData.content === 'string') {
      // Raw text content
      textContent = inputData.content;
      console.log('Processing raw text content');
    } else if (typeof inputData === 'string') {
      // Direct string input
      textContent = inputData;
      console.log('Processing direct string input');
    } else {
      console.warn('No suitable text content found for citation analysis');
      return createEmptyCitationResult();
    }
    
    if (!textContent || textContent.trim().length === 0) {
      console.warn('Empty text content for citation analysis');
      return createEmptyCitationResult();
    }
    
    console.log(`Analyzing ${textContent.length} characters for Bluebook citations`);
    
    try {
      const response = await callChatGPT(systemPrompt, textContent, "2000");
      
      if (!response || !response.trim()) {
        console.warn('Empty response from ChatGPT for citation analysis');
        return createEmptyCitationResult();
      }
      
      console.log('Raw ChatGPT response:', response.substring(0, 500));
      
      // Parse the JSON response
      let parsedResponse;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse citation analysis response:', parseError);
        console.log('Raw response:', response);
        return createEmptyCitationResult();
      }
      
      // Transform citations into redline suggestions
      const redlineSuggestions = (parsedResponse.citations || []).map((citation: any, index: number) => ({
        id: `citation-${index + 1}`,
        type: 'citation-highlight',
        startPos: citation.startPos || 0,
        endPos: citation.endPos || citation.text?.length || 0,
        originalText: citation.text || '',
        suggestedText: citation.bluebookFormat || citation.text || '',
        explanation: `Potential ${citation.type} citation: ${citation.text}${citation.needsVerification ? ' (needs verification)' : ''}`,
        severity: 'info' as const,
        status: 'pending' as const
      }));
      
      const result: CitationFinderOutput = {
        citations: parsedResponse.citations || [],
        summary: parsedResponse.summary || {
          totalCitations: 0,
          caseCount: 0,
          statuteCount: 0,
          incompleteCount: 0
        },
        redlineSuggestions
      };
      
      console.log(`Citation analysis completed: ${result.citations.length} citations found, ${redlineSuggestions.length} redline suggestions created`);
      
      return {
        success: true,
        output: result,
        metadata: {
          moduleType: 'citation-finder',
          citationsFound: result.citations.length,
          redlineSuggestionsCreated: redlineSuggestions.length,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Error in citation finder processor:', error);
      return {
        success: false,
        output: createEmptyCitationResult(),
        error: error instanceof Error ? error.message : 'Unknown error in citation analysis',
        metadata: {
          moduleType: 'citation-finder',
          error: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  };
};

function createEmptyCitationResult(): CitationFinderOutput {
  return {
    citations: [],
    summary: {
      totalCitations: 0,
      caseCount: 0,
      statuteCount: 0,
      incompleteCount: 0
    },
    redlineSuggestions: []
  };
}
