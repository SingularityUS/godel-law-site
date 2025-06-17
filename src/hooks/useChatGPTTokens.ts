
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
      const storageKey = `chatgpt_tokens_${user.id}`;
      const savedUsage = localStorage.getItem(storageKey);
      
      console.log(`Loading token usage for user ${user.id}:`, savedUsage);
      
      if (savedUsage) {
        try {
          const parsedUsage = JSON.parse(savedUsage);
          console.log(`Restored token usage:`, parsedUsage);
          setTokenUsage(parsedUsage);
        } catch (error) {
          console.error('Failed to parse saved token usage:', error);
          // Reset to default if corrupted
          const defaultUsage = { totalTokens: 0, lastUpdated: new Date().toISOString() };
          setTokenUsage(defaultUsage);
          localStorage.setItem(storageKey, JSON.stringify(defaultUsage));
        }
      } else {
        console.log('No previous token usage found, starting fresh');
      }
    }
  }, [user]);

  // Add tokens to the usage count
  const addTokens = useCallback((newTokens: number) => {
    if (!user || newTokens <= 0) {
      console.warn('Cannot add tokens: user not authenticated or invalid token count', { user: !!user, newTokens });
      return;
    }
    
    const storageKey = `chatgpt_tokens_${user.id}`;
    
    setTokenUsage(prevUsage => {
      const updatedUsage = {
        totalTokens: prevUsage.totalTokens + newTokens,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`Adding ${newTokens} tokens. Previous: ${prevUsage.totalTokens}, New total: ${updatedUsage.totalTokens}`);
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedUsage));
        console.log(`Token usage saved to localStorage:`, updatedUsage);
      } catch (error) {
        console.error('Failed to save token usage to localStorage:', error);
      }
      
      return updatedUsage;
    });
  }, [user]);

  // Get formatted token count
  const getFormattedTokenCount = useCallback(() => {
    const tokens = tokenUsage.totalTokens;
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  }, [tokenUsage.totalTokens]);

  // Debug function to check current state
  const debugTokenState = useCallback(() => {
    console.log('Current token state:', {
      user: user?.id,
      tokenUsage,
      storageKey: user ? `chatgpt_tokens_${user.id}` : 'no user',
      localStorage: user ? localStorage.getItem(`chatgpt_tokens_${user.id}`) : 'no user'
    });
  }, [user, tokenUsage]);

  return {
    tokenUsage,
    addTokens,
    getFormattedTokenCount,
    debugTokenState
  };
};
