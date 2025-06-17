
/**
 * useChatGPTApi Hook
 * 
 * Purpose: Handles ChatGPT API integration through Supabase Edge Function
 * Enhanced with support for large documents and higher token limits
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChatGPTTokens } from "@/hooks/useChatGPTTokens";

export const useChatGPTApi = () => {
  const { addTokens } = useChatGPTTokens();

  /**
   * Call ChatGPT API through Supabase Edge Function with configurable options
   */
  const callChatGPT = useCallback(async (
    prompt: string, 
    systemPrompt?: string, 
    model = 'gpt-4o-mini',
    maxTokens?: number
  ) => {
    try {
      // Determine appropriate token limit based on prompt size and model
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      let responseTokens = maxTokens;
      
      if (!responseTokens) {
        if (estimatedInputTokens > 10000) {
          responseTokens = 4000; // Large documents need substantial response space
        } else if (estimatedInputTokens > 5000) {
          responseTokens = 3000;
        } else {
          responseTokens = 2000; // Default
        }
      }
      
      // Upgrade to more capable model for very large inputs
      let selectedModel = model;
      if (estimatedInputTokens > 15000 && model === 'gpt-4o-mini') {
        selectedModel = 'gpt-4o';
        console.log(`Upgrading to ${selectedModel} for large document processing`);
      }
      
      console.log(`ChatGPT API call: ${estimatedInputTokens} input tokens, ${responseTokens} max response tokens, model: ${selectedModel}`);

      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          prompt,
          systemPrompt,
          model: selectedModel,
          maxTokens: responseTokens
        }
      });

      if (error) throw error;
      
      // Track token usage
      if (data.usage && data.usage.total_tokens) {
        addTokens(data.usage.total_tokens);
      }
      
      return data;
    } catch (error: any) {
      console.error('ChatGPT API call failed:', error);
      return {
        error: error.message || 'ChatGPT processing failed',
        timestamp: new Date().toISOString()
      };
    }
  }, [addTokens]);

  return { callChatGPT };
};
