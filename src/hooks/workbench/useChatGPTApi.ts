
/**
 * useChatGPTApi Hook
 * 
 * Purpose: Handles ChatGPT API integration through Supabase Edge Function
 * Enhanced for GPT-4.1 with advanced document processing capabilities
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChatGPTTokens } from "@/hooks/useChatGPTTokens";

export const useChatGPTApi = () => {
  const { addTokens } = useChatGPTTokens();

  /**
   * Call ChatGPT API through Supabase Edge Function with GPT-4.1 as default
   */
  const callChatGPT = useCallback(async (
    prompt: string, 
    systemPrompt?: string, 
    model = 'gpt-4.1-2025-04-14',
    maxTokens?: number
  ) => {
    try {
      // Use GPT-4.1's enhanced context window (200K tokens)
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      let responseTokens = maxTokens;
      
      if (!responseTokens) {
        // GPT-4.1 can handle much larger responses
        if (estimatedInputTokens > 50000) {
          responseTokens = 8000; // Large documents get substantial response space
        } else if (estimatedInputTokens > 20000) {
          responseTokens = 6000;
        } else if (estimatedInputTokens > 10000) {
          responseTokens = 4000;
        } else {
          responseTokens = 3000; // Default for GPT-4.1
        }
      }
      
      console.log(`GPT-4.1 API call: ${estimatedInputTokens} input tokens, ${responseTokens} max response tokens, model: ${model}`);

      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          prompt,
          systemPrompt,
          model,
          maxTokens: responseTokens
        }
      });

      if (error) {
        console.error('ChatGPT API error:', error);
        throw error;
      }
      
      // Track token usage using centralized hook
      if (data && data.usage && data.usage.total_tokens) {
        console.log(`GPT-4.1 API used ${data.usage.total_tokens} tokens`);
        addTokens(data.usage.total_tokens);
      }
      
      return data;
    } catch (error: any) {
      console.error('GPT-4.1 API call failed:', error);
      return {
        error: error.message || 'GPT-4.1 processing failed',
        timestamp: new Date().toISOString()
      };
    }
  }, [addTokens]);

  return { callChatGPT };
};
