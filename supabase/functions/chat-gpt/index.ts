
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests FIRST, before any authentication
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  console.log(`Received ${req.method} request to chat-gpt function`);

  try {
    const { prompt, model = 'gpt-4.1-2025-04-14', systemPrompt, maxTokens = 4000 } = await req.json();
    
    console.log('Request payload:', { 
      promptLength: prompt?.length, 
      model, 
      systemPromptLength: systemPrompt?.length,
      maxTokens 
    });

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, proceeding with request');

    // Estimate input tokens and adjust model if needed
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    let selectedModel = model;
    let adjustedMaxTokens = maxTokens;
    
    // GPT-4.1 specifications with 200K context window
    const modelLimits = {
      'gpt-4.1-2025-04-14': { maxTotal: 200000, maxOutput: 16384 },
      'gpt-4o': { maxTotal: 128000, maxOutput: 4096 },
      'gpt-4o-mini': { maxTotal: 128000, maxOutput: 16384 }
    };
    
    const limits = modelLimits[selectedModel as keyof typeof modelLimits] || modelLimits['gpt-4.1-2025-04-14'];
    const systemTokens = systemPrompt ? Math.ceil(systemPrompt.length / 4) : 0;
    const availableOutputTokens = Math.min(
      adjustedMaxTokens,
      limits.maxOutput,
      limits.maxTotal - estimatedInputTokens - systemTokens - 100 // Safety buffer
    );
    
    if (availableOutputTokens < 100) {
      throw new Error('Input too large for selected model. Consider reducing document content or using document summaries.');
    }

    console.log(`Processing ChatGPT request: { model: "${selectedModel}", inputTokens: ${estimatedInputTokens}, maxOutputTokens: ${availableOutputTokens}, contextLimit: ${limits.maxTotal} }`);

    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ];

    console.log('Making request to OpenAI API...');

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

    console.log(`OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received successfully');
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure:', data);
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
      status: 200
    });

  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    
    const errorResponse = {
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      details: error.stack || 'No stack trace available'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
