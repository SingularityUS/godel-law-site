
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
    const { documentName, documentContent, documentType, customPrompt } = await req.json()

    console.log('Processing citations for document:', documentName)
    console.log('Document type:', documentType)
    console.log('Custom prompt provided:', !!customPrompt)
    console.log('Document content length:', documentContent?.length || 0)

    if (!documentContent) {
      throw new Error('Document content is required')
    }

    if (!customPrompt) {
      throw new Error('Citation extraction prompt is required')
    }

    // Call GPT-4.1 for citation analysis using the user's custom prompt
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Calling OpenAI GPT-4.1 with custom prompt length:', customPrompt.length)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-11-20', // Using the latest GPT-4 model available
        messages: [
          { role: 'system', content: customPrompt },
          { role: 'user', content: documentContent }
        ],
        max_tokens: 8000,
        temperature: 0.1
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const citationResponse = data.choices[0].message.content

    console.log('GPT-4 citation response length:', citationResponse.length)
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

    return new Response(
      JSON.stringify({
        citations,
        documentName,
        totalCitations: citations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Citation extraction error:', error)
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
