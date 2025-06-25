
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== ANALYZE CITATIONS FUNCTION INVOKED ===')
    
    const requestBody = await req.json()
    const { documentContent, prompt, documentName } = requestBody

    console.log('Processing citation analysis for:', documentName)
    console.log('Document content length:', documentContent?.length || 0)
    console.log('Prompt length:', prompt?.length || 0)

    if (!documentContent) {
      throw new Error('Document content is required')
    }

    if (!prompt) {
      throw new Error('Analysis prompt is required')
    }

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Calling GPT-4.1 for citation analysis...')

    // Call GPT-4.1 with document and prompt
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: documentContent }
        ],
        max_tokens: 8000,
        temperature: 0.1
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const analysisResult = openaiData.choices[0].message.content

    console.log('GPT-4.1 analysis result length:', analysisResult.length)

    // Try to parse as JSON, but return raw text if parsing fails
    let parsedResult
    try {
      parsedResult = JSON.parse(analysisResult)
    } catch (parseError) {
      console.warn('Could not parse result as JSON, returning raw text')
      parsedResult = analysisResult
    }

    const result = {
      documentName,
      rawResponse: analysisResult,
      parsedData: parsedResult,
      success: true
    }

    console.log('Analysis completed successfully')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('=== CITATION ANALYSIS ERROR ===')
    console.error('Error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
