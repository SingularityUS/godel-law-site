
/**
 * Grammar Response Parser Utility
 * 
 * Purpose: Main parser that coordinates different parsing strategies for grammar responses
 */

import { parseDirectJson, extractJsonFromText } from './grammarParsing/grammarJsonParser';
import { extractGrammarData } from './grammarParsing/grammarDataExtractor';
import { createFallbackAnalysis } from './grammarParsing/grammarFallbackParser';

export const parseGrammarResponse = (response: any): any => {
  console.log('Parsing grammar response, type:', typeof response);
  
  // Handle response object from ChatGPT API
  let responseText: string;
  if (typeof response === 'object' && response !== null) {
    if (response.response && typeof response.response === 'string') {
      responseText = response.response;
      console.log('Extracted response text from API object, length:', responseText.length);
    } else if (typeof response === 'string') {
      responseText = response;
    } else {
      // If it's an object but structured differently, try to stringify and parse
      responseText = JSON.stringify(response);
      console.log('Converted object to string for parsing');
    }
  } else if (typeof response === 'string') {
    responseText = response;
  } else {
    console.error('Unexpected response type:', typeof response);
    responseText = String(response);
  }
  
  console.log('Processing response text, length:', responseText.length);
  
  // Try direct JSON parsing first for structured responses
  const directJsonResult = parseDirectJson(responseText);
  if (directJsonResult) {
    return {
      output: directJsonResult
    };
  }

  // Try to extract JSON from text response with better patterns
  const extractedJsonResult = extractJsonFromText(responseText);
  if (extractedJsonResult) {
    return {
      output: extractedJsonResult
    };
  }
  
  // Enhanced fallback parsing for better data extraction
  const extractedData = extractGrammarData(responseText);
  
  // If no structured analysis found, create analysis from the response
  if (extractedData.analysis.length === 0) {
    const fallbackResult = createFallbackAnalysis(responseText);
    console.log(`Grammar parsing complete (fallback): ${fallbackResult.analysis.length} paragraphs, ${fallbackResult.overallAssessment.totalErrors} total errors`);
    
    return {
      output: fallbackResult
    };
  }

  console.log(`Grammar parsing complete: ${extractedData.analysis.length} paragraphs, ${extractedData.overallAssessment.totalErrors} total errors`);

  return {
    output: extractedData
  };
};
