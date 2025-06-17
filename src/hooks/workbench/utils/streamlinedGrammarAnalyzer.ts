
/**
 * Streamlined Grammar Analyzer
 * 
 * Purpose: Simple, position-aware grammar analysis for redlining with enhanced debugging
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
 * Enhanced prompt for grammar analysis with clear JSON requirements
 */
const GRAMMAR_ANALYSIS_PROMPT = `You are a legal writing expert. Review this paragraph for grammar, style, and clarity issues.

CRITICAL: You must analyze the actual paragraph content provided and return ONLY a valid JSON object.

Return this exact JSON structure:
{
  "suggestions": [
    {
      "type": "grammar|style|legal|clarity",
      "severity": "low|medium|high", 
      "originalText": "exact text from paragraph that needs improvement",
      "suggestedText": "your improved version",
      "explanation": "brief explanation of the issue",
      "startPos": 0,
      "endPos": 10
    }
  ],
  "overallScore": 8.5
}

Rules:
- Analyze the ENTIRE paragraph content provided
- Only suggest improvements for actual issues you find
- originalText must be exact text from the paragraph
- startPos/endPos are character positions within the paragraph
- overallScore is 0-10 (10 = perfect)
- Return empty suggestions array if no issues found
- DO NOT include any text outside the JSON object`;

/**
 * Analyze a single paragraph for grammar and style issues with enhanced debugging
 */
export const analyzeParagraph = async (
  paragraph: { id: string; content: string },
  callGPT: (prompt: string, systemPrompt?: string, model?: string, maxTokens?: number) => Promise<any>
): Promise<ParagraphAnalysis> => {
  const startTime = Date.now();
  
  console.log(`\n=== ANALYZING PARAGRAPH ${paragraph.id} ===`);
  console.log('Paragraph content length:', paragraph.content?.length || 0);
  console.log('Paragraph content preview:', paragraph.content?.substring(0, 100) + '...');
  console.log('Full paragraph content:', JSON.stringify(paragraph.content));
  
  // Validate input
  if (!paragraph.content || paragraph.content.trim().length === 0) {
    console.warn(`Paragraph ${paragraph.id} has no content to analyze`);
    return {
      paragraphId: paragraph.id,
      originalContent: paragraph.content || '',
      suggestions: [],
      overallScore: 8,
      processingTime: Date.now() - startTime
    };
  }
  
  const cleanContent = paragraph.content.trim();
  if (cleanContent.length < 10) {
    console.log(`Paragraph ${paragraph.id} too short for analysis (${cleanContent.length} chars)`);
    return {
      paragraphId: paragraph.id,
      originalContent: paragraph.content,
      suggestions: [],
      overallScore: 8,
      processingTime: Date.now() - startTime
    };
  }
  
  try {
    console.log(`Sending to ChatGPT for analysis:`);
    console.log('- Content length:', cleanContent.length);
    console.log('- Using system prompt length:', GRAMMAR_ANALYSIS_PROMPT.length);
    
    // FIXED: Correct parameter order - prompt first, then system prompt
    const response = await callGPT(cleanContent, GRAMMAR_ANALYSIS_PROMPT, 'gpt-4o-mini', 1000);
    
    console.log('ChatGPT raw response type:', typeof response);
    console.log('ChatGPT raw response:', JSON.stringify(response).substring(0, 300));
    
    // Enhanced response parsing
    let parsed;
    if (typeof response === 'string') {
      console.log('Response is string, attempting JSON extraction...');
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found JSON in response:', jsonMatch[0].substring(0, 200));
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in string response');
        throw new Error('No JSON found in response');
      }
    } else if (typeof response === 'object' && response !== null) {
      console.log('Response is object, using directly');
      parsed = response;
    } else {
      console.error('Unexpected response type:', typeof response);
      throw new Error('Unexpected response format');
    }
    
    console.log('Parsed response:', JSON.stringify(parsed));
    
    // Validate parsed response structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid parsed response structure');
    }
    
    // Validate and clean suggestions
    const suggestions: GrammarSuggestion[] = (parsed.suggestions || [])
      .filter((sug: any) => sug && typeof sug === 'object')
      .map((sug: any, index: number) => {
        console.log(`Processing suggestion ${index + 1}:`, sug);
        return {
          id: `${paragraph.id}-sug-${index + 1}`,
          type: ['grammar', 'style', 'legal', 'clarity'].includes(sug.type) ? sug.type : 'grammar',
          severity: ['low', 'medium', 'high'].includes(sug.severity) ? sug.severity : 'medium',
          originalText: String(sug.originalText || ''),
          suggestedText: String(sug.suggestedText || ''),
          explanation: String(sug.explanation || ''),
          startPos: Number(sug.startPos) || 0,
          endPos: Number(sug.endPos) || 0,
          paragraphId: paragraph.id
        };
      });
    
    const overallScore = Number(parsed.overallScore) || 8;
    const processingTime = Date.now() - startTime;
    
    console.log(`Analysis complete for ${paragraph.id}:`);
    console.log(`- ${suggestions.length} suggestions found`);
    console.log(`- Overall score: ${overallScore}`);
    console.log(`- Processing time: ${processingTime}ms`);
    
    return {
      paragraphId: paragraph.id,
      originalContent: paragraph.content,
      suggestions,
      overallScore,
      processingTime
    };
    
  } catch (error) {
    console.error(`Error analyzing paragraph ${paragraph.id}:`, error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return empty analysis on error with debugging info
    return {
      paragraphId: paragraph.id,
      originalContent: paragraph.content,
      suggestions: [],
      overallScore: 5, // Lower score to indicate processing issues
      processingTime: Date.now() - startTime
    };
  }
};

/**
 * Analyze multiple paragraphs with progress tracking and enhanced debugging
 */
export const analyzeDocument = async (
  paragraphs: { id: string; content: string }[],
  callGPT: (prompt: string, systemPrompt?: string, model?: string, maxTokens?: number) => Promise<any>,
  onProgress?: (completed: number, total: number) => void
): Promise<DocumentAnalysis> => {
  const startTime = Date.now();
  const results: ParagraphAnalysis[] = [];
  
  console.log(`\n=== STARTING DOCUMENT ANALYSIS ===`);
  console.log(`Total paragraphs to analyze: ${paragraphs.length}`);
  
  // Log paragraph details
  paragraphs.forEach((para, index) => {
    console.log(`Paragraph ${index + 1} (${para.id}): ${para.content?.length || 0} chars`);
  });
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    console.log(`\n--- Processing paragraph ${i + 1}/${paragraphs.length} ---`);
    
    // Update progress
    if (onProgress) {
      onProgress(i, paragraphs.length);
    }
    
    const analysis = await analyzeParagraph(paragraph, callGPT);
    results.push(analysis);
    
    console.log(`Paragraph ${i + 1} complete: ${analysis.suggestions.length} suggestions`);
    
    // Brief pause to avoid rate limiting
    if (i < paragraphs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(paragraphs.length, paragraphs.length);
  }
  
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  const averageScore = results.length > 0 ? 
    results.reduce((sum, r) => sum + r.overallScore, 0) / results.length : 0;
  const processingTime = Date.now() - startTime;
  
  console.log(`\n=== DOCUMENT ANALYSIS COMPLETE ===`);
  console.log(`- Total suggestions: ${totalSuggestions}`);
  console.log(`- Average score: ${averageScore.toFixed(1)}`);
  console.log(`- Total processing time: ${processingTime}ms`);
  
  return {
    paragraphs: results,
    totalSuggestions,
    averageScore,
    processingTime,
    timestamp: new Date().toISOString()
  };
};
