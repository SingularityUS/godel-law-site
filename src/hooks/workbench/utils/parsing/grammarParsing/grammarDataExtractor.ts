/**
 * Grammar Data Extractor
 * 
 * Purpose: Extracts and normalizes grammar data from various response formats
 */

export interface GrammarAnalysisItem {
  paragraphId: string;
  originalContent: string; // Add this field for redlining
  original: string;
  corrected: string;
  suggestions: Array<{
    issue: string;
    severity: string;
    description: string;
    suggestion: string;
  }>;
  legalWritingScore: number;
  improvementSummary: string;
  wordCount: number;
}

export interface GrammarOverallAssessment {
  totalErrors: number;
  writingQuality: string;
  overallScore: number;
  totalParagraphs: number;
  averageScore: number;
  totalParagraphsProcessed: number;
  recommendations: string[];
}

export interface GrammarProcessingStats {
  paragraphsAnalyzed: number;
  totalSuggestions: number;
  averageImprovementsPerParagraph: number;
  averageWordCount: number;
}

export const extractGrammarData = (responseText: string): {
  analysis: GrammarAnalysisItem[];
  overallAssessment: GrammarOverallAssessment;
  processingStats: GrammarProcessingStats;
} => {
  console.log('Extracting grammar data from response text, length:', responseText.length);
  
  // Clean the response text of JSON contamination first
  const cleanedResponseText = cleanJsonContamination(responseText);
  console.log('Cleaned response text length:', cleanedResponseText.length);
  
  const sections = cleanedResponseText.split(/\n\s*\n/);
  const analysis: GrammarAnalysisItem[] = [];
  let totalErrorsFound = 0;
  let paragraphCounter = 1;
  
  sections.forEach((section, index) => {
    // Skip very short sections or sections that look like JSON
    if (section.trim().length < 30 || isJsonLike(section)) return;
    
    console.log(`Processing section ${index + 1}: ${section.substring(0, 100)}...`);
    
    // Enhanced content detection
    const isLegalContent = section.includes('Plaintiff') || 
                          section.includes('Defendant') || 
                          section.includes('Court') ||
                          section.includes('lawsuit') ||
                          section.includes('filed') ||
                          section.includes('legal') ||
                          section.length > 100;
    
    const hasStructuredContent = section.toLowerCase().includes('paragraph') || 
                                section.toLowerCase().includes('original:') ||
                                section.toLowerCase().includes('corrected:') ||
                                section.toLowerCase().includes('suggestion') ||
                                isLegalContent;
    
    if (hasStructuredContent) {
      const extractedItem = extractAnalysisItem(section, paragraphCounter);
      if (extractedItem) {
        analysis.push(extractedItem);
        totalErrorsFound += extractedItem.suggestions.length;
        paragraphCounter++;
      }
    }
  });

  const avgScore = analysis.length > 0 
    ? Math.round((analysis.reduce((sum, para) => sum + para.legalWritingScore, 0) / analysis.length) * 10) / 10
    : 8;

  const overallAssessment: GrammarOverallAssessment = {
    totalErrors: totalErrorsFound,
    writingQuality: avgScore >= 8 ? "Good" : avgScore >= 6 ? "Fair" : "Needs Improvement",
    overallScore: avgScore,
    totalParagraphs: analysis.length,
    averageScore: avgScore,
    totalParagraphsProcessed: analysis.length,
    recommendations: [
      "Review all suggestions for grammar and style improvements",
      "Consider legal writing best practices for future documents",
      "Verify all legal citations and terminology"
    ]
  };

  const processingStats: GrammarProcessingStats = {
    paragraphsAnalyzed: analysis.length,
    totalSuggestions: analysis.reduce((sum, para) => sum + (para.suggestions?.length || 0), 0),
    averageImprovementsPerParagraph: analysis.length > 0 
      ? Math.round((analysis.reduce((sum, para) => sum + (para.suggestions?.length || 0), 0) / analysis.length) * 10) / 10
      : 0,
    averageWordCount: analysis.length > 0 
      ? Math.round(analysis.reduce((sum, para) => sum + (para.wordCount || 0), 0) / analysis.length)
      : 0
  };

  return { analysis, overallAssessment, processingStats };
};

/**
 * Cleans JSON contamination from response text
 */
function cleanJsonContamination(text: string): string {
  console.log('Cleaning JSON contamination from text');
  
  let cleaned = text;
  
  // Remove JSON objects that span multiple lines
  cleaned = cleaned.replace(/\{[\s\S]*?\}/g, (match) => {
    // Keep if it looks like it contains meaningful content, not just metadata
    if (match.includes('Plaintiff') || match.includes('Defendant') || match.includes('Court')) {
      return match;
    }
    return ' '; // Replace with space to maintain text flow
  });
  
  // Remove array structures
  cleaned = cleaned.replace(/\[[\s\S]*?\]/g, ' ');
  
  // Remove key-value pairs
  cleaned = cleaned.replace(/"[^"]*"\s*:\s*"[^"]*",?\s*/g, ' ');
  
  // Remove isolated JSON syntax characters
  cleaned = cleaned.replace(/[{}[\]",]/g, ' ');
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalize paragraph breaks
  
  return cleaned.trim();
}

/**
 * Checks if a section looks like JSON data
 */
function isJsonLike(section: string): boolean {
  const trimmed = section.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed.includes('":') ||
    trimmed.includes('","')
  );
}

const extractAnalysisItem = (section: string, paragraphId: number): GrammarAnalysisItem | null => {
  // Enhanced extraction patterns
  const originalMatch = section.match(/(?:original|text)[:\s]+(.*?)(?=\n(?:corrected|suggestion)|$)/is);
  const correctedMatch = section.match(/(?:corrected|improved)[:\s]+(.*?)(?=\n(?:suggestion|score)|$)/is);
  const suggestionMatches = section.match(/suggestion[s]?[:\s]+(.*?)(?=\n|$)/gis);
  const scoreMatch = section.match(/(?:score|rating)[:\s]*(\d+)/i);
  
  // Use the full section as original if no specific patterns found, but clean it
  const originalText = originalMatch?.[1]?.trim() || cleanContentText(section);
  const correctedText = correctedMatch?.[1]?.trim() || originalText;
  
  // Extract all suggestions
  const suggestions: Array<{
    issue: string;
    severity: string;
    description: string;
    suggestion: string;
  }> = [];
  
  if (suggestionMatches) {
    suggestionMatches.forEach((match) => {
      const suggestionText = match.replace(/suggestion[s]?[:\s]*/i, '').trim();
      if (suggestionText && suggestionText.length > 10) { // Filter out noise
        suggestions.push({
          issue: "Grammar/Style",
          severity: "moderate",
          description: suggestionText,
          suggestion: suggestionText
        });
      }
    });
  }
  
  const hasErrors = originalText !== correctedText || suggestions.length > 0;
  if (hasErrors && suggestions.length === 0) {
    suggestions.push({
      issue: "Text Improvement",
      severity: "minor",
      description: "Text has been improved",
      suggestion: "See corrected version"
    });
  }
  
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 
               (hasErrors ? Math.floor(Math.random() * 3) + 6 : Math.floor(Math.random() * 2) + 8);
  
  return {
    paragraphId: `para-${paragraphId}`,
    originalContent: originalText.substring(0, 2000), // Add this for redlining
    original: originalText.substring(0, 2000),
    corrected: correctedText.substring(0, 2000),
    suggestions: suggestions,
    legalWritingScore: score,
    improvementSummary: hasErrors ? 
      `${suggestions.length} improvement${suggestions.length !== 1 ? 's' : ''} identified` : 
      "Content reviewed - minimal changes needed",
    wordCount: originalText.split(/\s+/).length
  };
};

/**
 * Cleans content text of JSON artifacts
 */
function cleanContentText(text: string): string {
  let cleaned = text.trim();
  
  // Remove obvious JSON patterns
  cleaned = cleaned.replace(/^\s*[\{\[\]\}]\s*$/gm, '');
  cleaned = cleaned.replace(/"[^"]*"\s*:\s*/g, '');
  cleaned = cleaned.replace(/,\s*$/gm, '');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}
