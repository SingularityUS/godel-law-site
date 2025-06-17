
/**
 * useChatGPTTokens Hook
 * 
 * Purpose: Manages ChatGPT token usage tracking across the application
 * Provides centralized token counting and persistent storage per user account
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface TokenUsage {
  totalTokens: number;
  lastUpdated: string;
}

export const useChatGPTTokens = () => {
  const { user } = useAuth();
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ 
    totalTokens: 0, 
    lastUpdated: '' 
  });

  // Load saved token usage on mount
  useEffect(() => {
    if (user) {
      const savedUsage = localStorage.getItem(`chatgpt_tokens_${user.id}`);
      if (savedUsage) {
        try {
          setTokenUsage(JSON.parse(savedUsage));
        } catch (error) {
          console.error('Failed to parse saved token usage:', error);
        }
      }
    }
  }, [user]);

  // Add tokens to the usage count
  const addTokens = useCallback((newTokens: number) => {
    if (!user || newTokens <= 0) return;
    
    const updatedUsage = {
      totalTokens: tokenUsage.totalTokens + newTokens,
      lastUpdated: new Date().toISOString()
    };
    
    setTokenUsage(updatedUsage);
    localStorage.setItem(`chatgpt_tokens_${user.id}`, JSON.stringify(updatedUsage));
  }, [user, tokenUsage.totalTokens]);

  // Get formatted token count
  const getFormattedTokenCount = useCallback(() => {
    const tokens = tokenUsage.totalTokens;
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  }, [tokenUsage.totalTokens]);

  return {
    tokenUsage,
    addTokens,
    getFormattedTokenCount
  };
};
