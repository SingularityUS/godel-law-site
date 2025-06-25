
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CitationResult {
  anchor: string;
  start_offset: number;
  end_offset: number;
  type: string;
  status: string;
  errors: string[];
  orig: string;
  suggested: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== EXTRACT CITATIONS FUNCTION INVOKED ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    const requestBody = await req.json()
    console.log('Request body keys:', Object.keys(requestBody))
    
    const { documentName, documentContent, documentType, customPrompt } = requestBody

    console.log('Processing citations for document:', documentName)
    console.log('Document type:', documentType)
    console.log('Custom prompt provided:', !!customPrompt)
    console.log('Document content length:', documentContent?.length || 0)

    if (!documentContent) {
      console.error('Missing document content')
      throw new Error('Document content is required')
    }

    if (!customPrompt) {
      console.error('Missing custom prompt')
      throw new Error('Citation extraction prompt is required')
    }

    // Call GPT-4.1 for citation analysis
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OpenAI API key not found in environment')
      throw new Error('OpenAI API key not configured')
    }

    console.log('Calling OpenAI GPT-4.1 with custom prompt length:', customPrompt.length)

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: customPrompt },
          { role: 'user', content: documentContent }
        ],
        max_tokens: 8000,
        temperature: 0.1
      }),
    })

    console.log('OpenAI response status:', openaiResponse.status)

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error response:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenAI response received, usage:', openaiData.usage)
    
    const citationResponse = openaiData.choices[0].message.content

    console.log('GPT-4.1 citation response length:', citationResponse.length)
    console.log('Response preview:', citationResponse.substring(0, 200))

    // Parse the JSON response
    let citations: CitationResult[] = []
    try {
      citations = JSON.parse(citationResponse)
      if (!Array.isArray(citations)) {
        console.warn('Response is not an array, attempting to extract array')
        citations = []
      }
    } catch (parseError) {
      console.error('Failed to parse citation JSON:', parseError)
      console.error('Raw response:', citationResponse)
      citations = []
    }

    console.log(`Successfully parsed ${citations.length} citations`)

    const result = {
      citations,
      documentName,
      totalCitations: citations.length
    }

    console.log('=== RETURNING RESULT ===')
    console.log('Total citations found:', result.totalCitations)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('=== CITATION EXTRACTION ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to extract citations',
        citations: [],
        totalCitations: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
