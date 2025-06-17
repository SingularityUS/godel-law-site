
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'gpt-4o-mini', systemPrompt, maxTokens = 1000 } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Estimate input tokens and adjust model if needed
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    let selectedModel = model;
    let adjustedMaxTokens = maxTokens;
    
    // Auto-upgrade model for large inputs
    if (estimatedInputTokens > 15000 && model === 'gpt-4o-mini') {
      selectedModel = 'gpt-4o';
      console.log(`Auto-upgrading to ${selectedModel} for large input (${estimatedInputTokens} tokens)`);
    }
    
    // Ensure we don't exceed model limits
    const modelLimits = {
      'gpt-4o-mini': { maxTotal: 128000, maxOutput: 16384 },
      'gpt-4o': { maxTotal: 128000, maxOutput: 4096 }
    };
    
    const limits = modelLimits[selectedModel as keyof typeof modelLimits] || modelLimits['gpt-4o-mini'];
    const systemTokens = systemPrompt ? Math.ceil(systemPrompt.length / 4) : 0;
    const availableOutputTokens = Math.min(
      adjustedMaxTokens,
      limits.maxOutput,
      limits.maxTotal - estimatedInputTokens - systemTokens - 100 // Safety buffer
    );
    
    if (availableOutputTokens < 100) {
      throw new Error('Input too large for selected model. Consider using document chunking.');
    }

    console.log(`Processing ChatGPT request: { model: "${selectedModel}", inputTokens: ${estimatedInputTokens}, maxOutputTokens: ${availableOutputTokens} }`);

    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: availableOutputTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI API');
    }
    
    const result = {
      response: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      timestamp: new Date().toISOString(),
      processingTime: Date.now(),
    };

    console.log(`ChatGPT response generated successfully (${result.usage?.total_tokens || 0} tokens used)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
