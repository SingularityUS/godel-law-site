
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
    console.log('- Content being sent:', cleanContent.substring(0, 200) + '...');
    
    // Call ChatGPT with correct parameter order: prompt, systemPrompt, model, maxTokens
    const response = await callGPT(cleanContent, GRAMMAR_ANALYSIS_PROMPT, 'gpt-4o-mini', 1000);
    
    console.log('ChatGPT raw response type:', typeof response);
    console.log('ChatGPT raw response structure:', Object.keys(response || {}));
    console.log('ChatGPT raw response:', JSON.stringify(response, null, 2).substring(0, 500));
    
    // Check for API error first
    if (response && response.error) {
      console.error('ChatGPT API returned error:', response.error);
      throw new Error(`API Error: ${response.error}`);
    }
    
    // Extract the actual content from the nested response structure
    let actualContent;
    if (response && response.response) {
      // The actual content is nested in response.response
      actualContent = response.response;
      console.log('Extracted nested response content:', typeof actualContent);
      console.log('Actual content preview:', actualContent.substring(0, 200));
    } else if (typeof response === 'string') {
      // Direct string response
      actualContent = response;
      console.log('Using direct string response');
    } else {
      console.error('Unexpected response structure - no nested response found');
      console.log('Available response keys:', Object.keys(response || {}));
      throw new Error('Invalid response structure from ChatGPT API');
    }
    
    // Enhanced JSON parsing with better error handling
    let parsed;
    if (typeof actualContent === 'string') {
      console.log('Parsing string content as JSON...');
      // Try to extract JSON from response
      const jsonMatch = actualContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found JSON in response:', jsonMatch[0].substring(0, 200));
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed JSON:', Object.keys(parsed));
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.log('Failed to parse content:', jsonMatch[0]);
          throw new Error('Failed to parse ChatGPT response as JSON');
        }
      } else {
        console.error('No JSON found in string response');
        console.log('String content:', actualContent);
        throw new Error('No JSON found in ChatGPT response');
      }
    } else if (typeof actualContent === 'object' && actualContent !== null) {
      console.log('Using object response directly');
      parsed = actualContent;
    } else {
      console.error('Unexpected content type:', typeof actualContent);
      throw new Error('Unexpected content format from ChatGPT');
    }
    
    console.log('Final parsed response:', JSON.stringify(parsed, null, 2));
    
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
    
    if (suggestions.length > 0) {
      console.log('Suggestions details:');
      suggestions.forEach((sug, idx) => {
        console.log(`  ${idx + 1}. ${sug.type} (${sug.severity}): "${sug.originalText}" -> "${sug.suggestedText}"`);
      });
    }
    
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
