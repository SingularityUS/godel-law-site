
/**
 * Streamlined Grammar Analyzer
 * 
 * Purpose: Simple, position-aware grammar analysis for redlining
 */

export interface GrammarSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'legal' | 'clarity';
  severity: 'low' | 'medium' | 'high';
  originalText: string;
  suggestedText: string;
  explanation: string;
  startPos: number;
  endPos: number;
  paragraphId: string;
}

export interface ParagraphAnalysis {
  paragraphId: string;
  originalContent: string;
  suggestions: GrammarSuggestion[];
  overallScore: number;
  processingTime: number;
}

export interface DocumentAnalysis {
  paragraphs: ParagraphAnalysis[];
  totalSuggestions: number;
  averageScore: number;
  processingTime: number;
  timestamp: string;
}

/**
 * Simple prompt for grammar analysis
 */
const GRAMMAR_ANALYSIS_PROMPT = `You are a legal writing expert. Review this paragraph for grammar, style, and clarity issues.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "suggestions": [
    {
      "type": "grammar|style|legal|clarity",
      "severity": "low|medium|high", 
      "originalText": "exact text from paragraph",
      "suggestedText": "your improvement",
      "explanation": "brief explanation",
      "startPos": 0,
      "endPos": 10
    }
  ],
  "overallScore": 8.5
}

Rules:
- Only suggest improvements for actual issues
- originalText must be exact text from the paragraph
- startPos/endPos are character positions within the paragraph
- overallScore is 0-10 (10 = perfect)
- Return empty suggestions array if no issues found`;

/**
 * Analyze a single paragraph for grammar and style issues
 */
export const analyzeParagraph = async (
  paragraph: { id: string; content: string },
  callGPT: (systemPrompt: string, userInput: string) => Promise<any>
): Promise<ParagraphAnalysis> => {
  const startTime = Date.now();
  
  console.log(`Analyzing paragraph ${paragraph.id}: "${paragraph.content.substring(0, 50)}..."`);
  
  try {
    const response = await callGPT(GRAMMAR_ANALYSIS_PROMPT, paragraph.content);
    
    // Parse response - expect clean JSON
    let parsed;
    if (typeof response === 'string') {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } else {
      parsed = response;
    }
    
    // Validate and clean suggestions
    const suggestions: GrammarSuggestion[] = (parsed.suggestions || []).map((sug: any, index: number) => ({
      id: `${paragraph.id}-sug-${index + 1}`,
      type: sug.type || 'grammar',
      severity: sug.severity || 'medium',
      originalText: sug.originalText || '',
      suggestedText: sug.suggestedText || '',
      explanation: sug.explanation || '',
      startPos: sug.startPos || 0,
      endPos: sug.endPos || 0,
      paragraphId: paragraph.id
    }));
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Analysis complete for ${paragraph.id}: ${suggestions.length} suggestions, score: ${parsed.overallScore}`);
    
    return {
      paragraphId: paragraph.id,
      originalContent: paragraph.content,
      suggestions,
      overallScore: parsed.overallScore || 8,
      processingTime
    };
    
  } catch (error) {
    console.error(`Error analyzing paragraph ${paragraph.id}:`, error);
    
    // Return empty analysis on error
    return {
      paragraphId: paragraph.id,
      originalContent: paragraph.content,
      suggestions: [],
      overallScore: 8,
      processingTime: Date.now() - startTime
    };
  }
};

/**
 * Analyze multiple paragraphs with progress tracking
 */
export const analyzeDocument = async (
  paragraphs: { id: string; content: string }[],
  callGPT: (systemPrompt: string, userInput: string) => Promise<any>,
  onProgress?: (completed: number, total: number) => void
): Promise<DocumentAnalysis> => {
  const startTime = Date.now();
  const results: ParagraphAnalysis[] = [];
  
  console.log(`Starting document analysis: ${paragraphs.length} paragraphs`);
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    // Update progress
    if (onProgress) {
      onProgress(i, paragraphs.length);
    }
    
    const analysis = await analyzeParagraph(paragraph, callGPT);
    results.push(analysis);
    
    // Brief pause to avoid rate limiting
    if (i < paragraphs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(paragraphs.length, paragraphs.length);
  }
  
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const processingTime = Date.now() - startTime;
  
  console.log(`Document analysis complete: ${totalSuggestions} total suggestions, average score: ${averageScore.toFixed(1)}`);
  
  return {
    paragraphs: results,
    totalSuggestions,
    averageScore,
    processingTime,
    timestamp: new Date().toISOString()
  };
};
