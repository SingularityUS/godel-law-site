
/**
 * Token Calculation Utilities for GPT-4.1
 * 
 * Provides accurate token estimation and context window management
 */

export interface TokenEstimate {
  promptTokens: number;
  documentTokens: number;
  systemTokens: number;
  totalTokens: number;
  remainingTokens: number;
  estimatedCost: number;
  isWithinLimit: boolean;
}

export interface ModelSpec {
  maxContextTokens: number;
  maxOutputTokens: number;
  costPer1KTokens: number;
  name: string;
}

// Model specifications with current pricing estimates
export const MODEL_SPECS: Record<string, ModelSpec> = {
  'gpt-4.1-2025-04-14': {
    maxContextTokens: 200000,
    maxOutputTokens: 16384,
    costPer1KTokens: 0.03, // Estimated pricing
    name: 'GPT-4.1'
  },
  'gpt-4o': {
    maxContextTokens: 128000,
    maxOutputTokens: 4096,
    costPer1KTokens: 0.015,
    name: 'GPT-4o'
  },
  'gpt-4o-mini': {
    maxContextTokens: 128000,
    maxOutputTokens: 16384,
    costPer1KTokens: 0.0015,
    name: 'GPT-4o Mini'
  }
};

/**
 * More accurate token estimation than simple length/4
 * Based on OpenAI's tokenization patterns
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Basic estimation: average of 3.5-4.5 characters per token
  // Adjust for common patterns
  let tokens = text.length / 4;
  
  // Adjust for whitespace (tokens are often full words)
  const words = text.split(/\s+/).length;
  tokens = Math.max(tokens, words * 0.75);
  
  // Adjust for punctuation and special characters
  const specialChars = (text.match(/[.,;:!?()[\]{}"'`]/g) || []).length;
  tokens += specialChars * 0.3;
  
  return Math.ceil(tokens);
}

/**
 * Calculate comprehensive token usage for a chat request
 */
export function calculateTokenUsage(
  prompt: string,
  documents: Array<{ name: string; extractedText?: string }>,
  systemPrompt?: string,
  model: string = 'gpt-4.1-2025-04-14'
): TokenEstimate {
  const modelSpec = MODEL_SPECS[model] || MODEL_SPECS['gpt-4.1-2025-04-14'];
  
  const promptTokens = estimateTokens(prompt);
  const systemTokens = estimateTokens(systemPrompt || '');
  
  // Calculate document tokens
  const documentTokens = documents.reduce((total, doc) => {
    if (!doc.extractedText) return total;
    return total + estimateTokens(doc.extractedText);
  }, 0);
  
  // Add tokens for document formatting and metadata
  const formattingTokens = documents.length * 50; // Estimated overhead per document
  
  const totalTokens = promptTokens + documentTokens + systemTokens + formattingTokens;
  const remainingTokens = Math.max(0, modelSpec.maxContextTokens - totalTokens);
  const estimatedCost = (totalTokens / 1000) * modelSpec.costPer1KTokens;
  const isWithinLimit = totalTokens <= modelSpec.maxContextTokens;
  
  return {
    promptTokens,
    documentTokens: documentTokens + formattingTokens,
    systemTokens,
    totalTokens,
    remainingTokens,
    estimatedCost,
    isWithinLimit
  };
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toLocaleString();
}

/**
 * Get context utilization percentage
 */
export function getContextUtilization(totalTokens: number, model: string = 'gpt-4.1-2025-04-14'): number {
  const modelSpec = MODEL_SPECS[model] || MODEL_SPECS['gpt-4.1-2025-04-14'];
  return Math.min(100, (totalTokens / modelSpec.maxContextTokens) * 100);
}

/**
 * Suggest optimizations when approaching context limits
 */
export function getOptimizationSuggestions(estimate: TokenEstimate, model: string): string[] {
  const suggestions: string[] = [];
  const utilization = getContextUtilization(estimate.totalTokens, model);
  
  if (utilization > 90) {
    suggestions.push('Context window nearly full - consider using document summaries');
    suggestions.push('Remove non-essential documents from the context');
  } else if (utilization > 75) {
    suggestions.push('High token usage - consider shorter prompts');
    suggestions.push('Use document excerpts instead of full content');
  } else if (utilization > 50) {
    suggestions.push('Moderate token usage - you have room for more detailed prompts');
  }
  
  if (estimate.documentTokens > estimate.promptTokens * 10) {
    suggestions.push('Documents are much larger than prompt - consider focusing on specific sections');
  }
  
  return suggestions;
}
