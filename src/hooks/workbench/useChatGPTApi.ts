
/**
 * useChatGPTApi Hook
 * 
 * Purpose: Handles ChatGPT API integration through Supabase Edge Function
 * Provides a clean interface for calling ChatGPT with token tracking
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChatGPTTokens } from "@/hooks/useChatGPTTokens";

export const useChatGPTApi = () => {
  const { addTokens } = useChatGPTTokens();

  /**
   * Call ChatGPT API through Supabase Edge Function
   */
  const callChatGPT = useCallback(async (prompt: string, systemPrompt?: string, model = 'gpt-4o-mini') => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          prompt,
          systemPrompt,
          model,
          maxTokens: 2000
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
