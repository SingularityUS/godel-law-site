
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CitationCorrection {
  anchor: string;
  start_offset: number;
  end_offset: number;
  original: string;
  suggested: string;
  explanation?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentName, documentContent, documentType } = await req.json()

    console.log('Processing document for citations:', documentName)

    if (!documentContent) {
      throw new Error('Document content is required')
    }

    // Insert anchor tokens before paragraphs for position mapping
    const anchoredContent = insertAnchorTokens(documentContent)
    console.log('Anchored content length:', anchoredContent.length)

    // Call GPT-4.1 for citation analysis
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are a legal citation expert specializing in Bluebook format. Analyze the provided document text for citation errors and return corrections in JSON format.

The document text contains anchor tokens in the format ⟦P-#####⟧ that mark paragraph positions. Your task is to:

1. Identify all legal citations that need correction according to Bluebook format
2. For each citation needing correction, return a JSON object with:
   - anchor: the nearest anchor token before the citation
   - start_offset: character offset from the anchor where the citation starts
   - end_offset: character offset from the anchor where the citation ends
   - original: the incorrect citation text
   - suggested: the corrected citation text
   - explanation: brief reason for the correction

Return ONLY a valid JSON array of correction objects. Do not include any other text.

Example format:
[
  {
    "anchor": "⟦P-00001⟧",
    "start_offset": 45,
    "end_offset": 67,
    "original": "Smith v. Jones 123 F.2d 456",
    "suggested": "Smith v. Jones, 123 F.2d 456 (2d Cir. 1942)",
    "explanation": "Missing court and year"
  }
]`

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
          { role: 'user', content: anchoredContent }
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
    let citations: CitationCorrection[] = []
    try {
      citations = JSON.parse(citationResponse)
      if (!Array.isArray(citations)) {
        citations = []
      }
    } catch (error) {
      console.error('Failed to parse citation JSON:', error)
      citations = []
    }

    console.log(`Found ${citations.length} citation corrections`)

    // Apply corrections to create redlined content
    const redlinedContent = applyCitationCorrections(anchoredContent, citations)

    return new Response(
      JSON.stringify({
        citations,
        redlinedContent,
        anchoredContent,
        // Note: In a full implementation, you would generate a DOCX file here
        // and upload it to storage to provide a download URL
        downloadUrl: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Citation processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process citations',
        citations: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function insertAnchorTokens(content: string): string {
  // Insert anchor tokens before each paragraph
  const paragraphs = content.split(/\n\s*\n/)
  let anchoredContent = ''
  
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.trim()) {
      const anchor = `⟦P-${String(index + 1).padStart(5, '0')}⟧`
      anchoredContent += anchor + paragraph
      if (index < paragraphs.length - 1) {
        anchoredContent += '\n\n'
      }
    }
  })
  
  return anchoredContent
}

function applyCitationCorrections(content: string, citations: CitationCorrection[]): string {
  if (citations.length === 0) {
    return content
  }

  // Sort citations by position for proper application
  const sortedCitations = [...citations].sort((a, b) => {
    const aAnchorPos = content.indexOf(a.anchor)
    const bAnchorPos = content.indexOf(b.anchor)
    if (aAnchorPos !== bAnchorPos) {
      return aAnchorPos - bAnchorPos
    }
    return a.start_offset - b.start_offset
  })

  let result = content
  let offset = 0

  sortedCitations.forEach((citation) => {
    const anchorPos = result.indexOf(citation.anchor, offset)
    if (anchorPos === -1) return

    const startPos = anchorPos + citation.start_offset
    const endPos = anchorPos + citation.end_offset

    if (startPos < result.length && endPos <= result.length) {
      const before = result.substring(0, startPos)
      const after = result.substring(endPos)
      const replacement = `[DELETED: ${citation.original}] [INSERTED: ${citation.suggested}]`
      
      result = before + replacement + after
      offset = startPos + replacement.length
    }
  })

  return result
}
