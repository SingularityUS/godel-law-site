
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
    const { documentName, documentContent, documentType } = await req.json()

    console.log('Processing citations for document:', documentName)

    if (!documentContent) {
      throw new Error('Document content is required')
    }

    // Call GPT-4.1 for citation analysis using the user's exact prompt
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are a legal citation expert specializing in The Bluebook format. Your task is to:

1. Read the full document text including the invisible anchor tags (⟦P-#####⟧).
2. Identify every legal citation that should conform to The Bluebook.
3. For each citation, decide whether it needs a correction; if so, propose the corrected form.
4. Return only a JSON array that follows the exact schema shown below—no extra keys, no commentary, no markdown, no trailing commas.

Schema:
[
  {
    "anchor": "P-00042",         // the anchor that immediately precedes the citation
    "start_offset": 12,          // # of characters from the anchor to the citation's first char
    "end_offset": 31,            // first char AFTER the citation
    "type": "case",              // one of: case, statute-code, session-law, regulation, constitution, rule/procedure, legislative-material, administrative-decision, book, periodical, internet, service, foreign, international, tribal, court-document, other
    "status": "Error",           // Error, Uncertain, or Correct
    "errors": [],                // array of concise rule-labelled errors (e.g., Rule 10.1.2 – missing pincite) if uncertain as to if an error exists state "uncertain"
    "orig": "Roe v. Wade, 410 U.S. 113 (1973)",
    "suggested": "Roe v. Wade, 410 U.S. 113, 114 (1973)"  // identical to orig if already perfect
  }
]

Return ONLY the JSON array. No additional text or explanation.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: documentContent }
        ],
        max_tokens: 8000,
        temperature: 0.1
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const citationResponse = data.choices[0].message.content

    console.log('GPT-4.1 citation response:', citationResponse.substring(0, 500))

    // Parse the JSON response
    let citations: CitationResult[] = []
    try {
      citations = JSON.parse(citationResponse)
      if (!Array.isArray(citations)) {
        citations = []
      }
    } catch (error) {
      console.error('Failed to parse citation JSON:', error)
      citations = []
    }

    console.log(`Found ${citations.length} citations`)

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
        citations: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
