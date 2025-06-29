
import { useState, useCallback, useEffect } from "react";
import { useChatGPTApi } from "./useChatGPTApi";

const CITATION_ANALYSIS_PROMPT = `You are a legal‐citation editor. Your task: 1. Read the full document text including the invisible anchor tags (⟦…⟧). 2. Identify every legal citation that should conform to The Bluebook. 3. For each citation, decide whether it needs a correction; if so, propose the corrected form. 4. Return only a JSON array that follows the exact schema shown below—no extra keys, no commentary, no markdown, no trailing commas.

[
  {
    "anchor": "P-00042", // the anchor that immediately precedes the citation
    "start_offset": 12, // # of characters from the anchor to the citation's first char
    "end_offset": 31, // first char AFTER the citation
    "type": "case", // one of: case, statute-code, session-law, regulation, constitution, rule/procedure, legislative-material, administrative-decision, book, periodical, internet, service, foreign, international, tribal, court-document, other.
    "status": "Error", // Error or Correct
    "errors": [], // array of concise rule-labelled errors (e.g., Rule 10.1.2 – missing pincite) if uncertain as to if an error exists state "uncertain".
    "orig": "Roe v. Wade, 410 U.S. 113 (1973)",
    "suggested": "Roe v. Wade, 410 U.S. 113, 114 (1973)" // identical to orig if already perfect
  }
]

Formatting rules:
• Return an empty [] if no citations are found in the document.
• Output must be valid JSON (UTF-8), parsable with any strict JSON parser.
• Do not escape the anchor tags or add line breaks inside field values.
• Keep suggested identical to orig when no change is required.
• Do not include explanations, headings, or extra text—only the JSON array.

FULL BLUEBOOK QUICK-REFERENCE:
✧ Global anatomy – Signal · Authority · (Explanatory Parenthetical) · (Subsequent history)
⊳ Signals in correct order (1.2, 1.3).
⊳ Explanatory parenthetical = present participle, no period unless full-sentence quote (1.5, B1.3).
⊳ Subsequent history after all other parens, separated by semicolon (10.7).

✧ Citation placement – B1.1
• Citation sentence → supports whole previous sentence → starts cap, ends "."
• Citation clause → supports partial sentence → comma-delimited, lower-case, no final period.

✧ Signals – 1.2 / B1.2
Support: [no signal] | e.g., | Accord | See | See also | Cf.
Compare/Contrast: Compare … with … | Contrast … with …
Contradict: Contra | But see | But cf.
Background: See generally
• Capitalise only when opening a citation sentence.
• Order signals as listed; group by signal-type into separate citation sentences if necessary (1.3).
• "e.g." may be attached to See/But see (italicised comma before, roman comma after).

✧ Pincites (3.2; 10.1.2; 12.1; 13.1; 14.1)
• Required except after see generally.
• Ranges: drop repeated digits (123–29).
• Footnote pin: 45 n.7.
• Multiple non-consecutive: 45, 48-49, 52.
• If citing first page, repeat it (150, 150).

✧ Typeface (court documents) – B2
Italic/underline → case names, signals, "id.", "supra", explanatory history phrases, introduction words ("quoted in").
Roman → reporter, code, §, dates, URLs, "Stat." etc.
Never italicise statutes or section symbols.

✧ Short forms & cross-references
• Id. → immediately-preceding single authority; add at __ if page differs (B4; 4.1).
• Supra/Hereinafter → allowed for books, periodicals, legislative hearings, etc.; never for cases, statutes, constitutions, regulations except in extraordinary circumstances (4.2; B4).
• Internal cross-refs → "supra note 14"; number notes sequentially (3.5).

✧ Abbreviations & symbols
• Case names: Table T6 (omit given names, "The", "et al."; abbreviate words ≥8 letters for space).
• Courts/reporters: Table T1/T7; United States not abbreviated when party.
• Geographic: Table T10.
• § / §§ for sections; ¶ for paragraphs.
• Spell out zero-to-ninety-nine; numerals for 100+. (B6).

✧ Local-rule supremacy – If the document's forum has a specific rule in Bluepages Table BT2, apply it over conflicting Bluebook guidance.

TYPE-SPECIFIC BLUEBOOK SKELETONS:
1. CASE (Rule 10): Name, Vol Reporter First-Page, pincite (Court Year) (optional explanatory) (optional history).
2. STATUTE – current code (Rule 12.3): Title U.S.C. § number (Year optional for U.S.C.).
3. SESSION LAW (12.4): Pub. L. No. 117-103, § 802, 136 Stat. 49, 120 (2022).
4. REGULATION (14.2): Title C.F.R. § ___ (Year of C.F.R.).
5. CONSTITUTION (Rule 11): U.S. Const. art. I, § 8, cl. 3.
6. LEGISLATIVE MATERIAL (Rule 13): H.R. Rep. No. 118-27, pt. 1, at 54 (2023).
7. ADMINISTRATIVE ADJUDICATION (14.3): Party v. Party, 249 NLRB 642 (1980).
8. BOOK / NON-PERIODIC (Rule 15): Vol Author, Title pincite (Edition Year).
9. PERIODICAL (Rule 16): Author, Article Title, Vol Abbrev. Journal First-Page, pincite (Year).
10. INTERNET (Rule 18): Author, Page Title, Site (Full Date & time), URL.
11. COURT DOCUMENT (B17): Abbrev. doc title (pincite) (Date if needed), Dkt. No. __.
12. FOREIGN (20) / INTERNATIONAL (21) / TRIBAL (22) – follow rules if encountered; always append jurisdiction parenthetical.

Output exactly the JSON schema shown above.`;

export const useCitationAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  // Change to Map for document-specific citation results
  const [citationResultsMap, setCitationResultsMap] = useState<Map<string, any>>(new Map());
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoProcessEnabled, setAutoProcessEnabled] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<Set<string>>(new Set());
  const { callChatGPT } = useChatGPTApi();

  // Get current document's citation results
  const citationResults = currentDocumentId ? citationResultsMap.get(currentDocumentId) || null : null;

  // Listen for document context changes to update current document
  useEffect(() => {
    const handleDocumentChange = (event: CustomEvent) => {
      const { documentName } = event.detail;
      console.log('📄 [CITATION] Document context changed to:', documentName);
      
      if (documentName !== currentDocumentId) {
        setCurrentDocumentId(documentName);
        setError(null); // Clear any previous errors when switching documents
        
        console.log('🔄 [CITATION] Switched to document:', documentName, 'Has cached results:', citationResultsMap.has(documentName));
      }
    };

    const handleSidebarPreview = (event: CustomEvent) => {
      const { name } = event.detail;
      console.log('👁️ [CITATION] Sidebar preview changed to:', name);
      
      if (name !== currentDocumentId) {
        setCurrentDocumentId(name);
        setError(null);
        
        console.log('🔄 [CITATION] Switched to preview document:', name, 'Has cached results:', citationResultsMap.has(name));
      }
    };

    window.addEventListener('showDocumentInSidebar', handleSidebarPreview as EventListener);
    window.addEventListener('documentContextChanged', handleDocumentChange as EventListener);

    return () => {
      window.removeEventListener('showDocumentInSidebar', handleSidebarPreview as EventListener);
      window.removeEventListener('documentContextChanged', handleDocumentChange as EventListener);
    };
  }, [currentDocumentId, citationResultsMap]);

  const processCitations = useCallback(async (documentText: string, documentId?: string) => {
    const targetDocumentId = documentId || currentDocumentId || 'unknown';
    
    console.log('🔄 [CITATION] Starting processCitations:', {
      documentId: targetDocumentId,
      hasDocumentText: !!documentText,
      documentTextLength: documentText?.length || 0,
      isProcessing,
      autoProcessEnabled,
      processingQueueSize: processingQueue.size,
      hasCachedResults: citationResultsMap.has(targetDocumentId)
    });

    if (!documentText || !documentText.trim()) {
      console.error('❌ [CITATION] No document text provided for analysis');
      setError("No document text provided for analysis");
      return;
    }

    // Validate anchor text format with detailed logging
    const anchorMatches = documentText.match(/⟦P-\d{5}⟧/g);
    if (!anchorMatches || anchorMatches.length === 0) {
      console.error('❌ [CITATION] Document text lacks proper anchor tags');
      console.error('🔍 [CITATION] Text analysis:', {
        textLength: documentText.length,
        firstChars: documentText.substring(0, 200),
        anchorPattern: /⟦P-\d{5}⟧/.test(documentText),
        anchorMatches: anchorMatches
      });
      setError("Document text lacks proper anchor tags for citation analysis");
      return;
    }

    console.log('✅ [CITATION] Found anchor tags:', {
      count: anchorMatches.length,
      first5: anchorMatches.slice(0, 5)
    });

    // Check if we already have results for this document
    if (citationResultsMap.has(targetDocumentId)) {
      console.log('⏭️ [CITATION] Using cached results for document:', targetDocumentId);
      setCurrentDocumentId(targetDocumentId);
      return;
    }

    // Check if document is already in processing queue
    if (processingQueue.has(targetDocumentId)) {
      console.log('⏭️ [CITATION] Document already in processing queue:', targetDocumentId);
      return;
    }

    // Add to processing queue
    setProcessingQueue(prev => {
      const newSet = new Set([...prev, targetDocumentId]);
      console.log('📝 [CITATION] Added to processing queue:', targetDocumentId, 'Queue size:', newSet.size);
      return newSet;
    });

    setIsProcessing(true);
    setError(null);
    setCurrentDocumentId(targetDocumentId);

    try {
      console.log('🚀 [CITATION] Starting citation analysis with GPT-4.1...');
      console.log('📊 [CITATION] Analysis parameters:', {
        documentId: targetDocumentId,
        textLength: documentText.length,
        anchorTagCount: anchorMatches.length,
        autoProcessEnabled,
        queueSize: processingQueue.size
      });
      
      const response = await callChatGPT(
        documentText,
        CITATION_ANALYSIS_PROMPT,
        'gpt-4.1-2025-04-14',
        8000 // Allow substantial response for detailed citation analysis
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const responseContent = response.response;
      console.log('📥 [CITATION] Raw GPT response received:', {
        length: responseContent.length,
        preview: responseContent.substring(0, 300) + '...',
        documentId: targetDocumentId
      });

      // Try to parse the JSON response
      try {
        const parsedResults = JSON.parse(responseContent);
        console.log('✅ [CITATION] Successfully parsed citation results:', {
          resultCount: Array.isArray(parsedResults) ? parsedResults.length : 'Not an array',
          documentId: targetDocumentId,
          isArray: Array.isArray(parsedResults),
          firstResult: Array.isArray(parsedResults) && parsedResults.length > 0 ? parsedResults[0] : null
        });
        
        // Store results for this specific document
        setCitationResultsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(targetDocumentId, parsedResults);
          console.log('💾 [CITATION] Cached results for document:', targetDocumentId, 'Total cached documents:', newMap.size);
          return newMap;
        });

        // Dispatch completion event for UI updates
        const completionEvent = new CustomEvent('citationAnalysisComplete', {
          detail: {
            documentId: targetDocumentId,
            results: parsedResults,
            citationCount: Array.isArray(parsedResults) ? parsedResults.length : 0
          }
        });
        console.log('📤 [CITATION] Dispatching citationAnalysisComplete event');
        window.dispatchEvent(completionEvent);

      } catch (parseError) {
        console.error('💥 [CITATION] Failed to parse JSON response:', parseError);
        console.error('📄 [CITATION] Raw response was:', responseContent);
        
        // Try to extract JSON from the response if it's wrapped in markdown or other text
        const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log('✅ [CITATION] Extracted and parsed citation results from wrapped response');
            
            setCitationResultsMap(prev => {
              const newMap = new Map(prev);
              newMap.set(targetDocumentId, extractedJson);
              return newMap;
            });

            // Dispatch completion event
            const completionEvent = new CustomEvent('citationAnalysisComplete', {
              detail: {
                documentId: targetDocumentId,
                results: extractedJson,
                citationCount: Array.isArray(extractedJson) ? extractedJson.length : 0
              }
            });
            window.dispatchEvent(completionEvent);

          } catch (extractError) {
            console.error('💥 [CITATION] Failed to extract JSON from response:', extractError);
            setError(`Failed to parse citation analysis response: ${parseError.message}`);
          }
        } else {
          console.error('❌ [CITATION] No JSON array found in response');
          setError(`Response is not valid JSON. Raw response: ${responseContent.substring(0, 500)}...`);
        }
      }
    } catch (error: any) {
      console.error('💥 [CITATION] Citation analysis error:', error);
      console.error('🔍 [CITATION] Error details:', {
        documentId: targetDocumentId,
        errorMessage: error.message || 'Unknown error',
        errorStack: error.stack || 'No stack trace'
      });
      setError(error.message || 'Failed to analyze citations');
      
      // Dispatch error event
      const errorEvent = new CustomEvent('citationAnalysisError', {
        detail: {
          documentId: targetDocumentId,
          error: error.message || 'Failed to analyze citations',
          source: 'citation-analysis'
        }
      });
      console.log('📤 [CITATION] Dispatching citationAnalysisError event');
      window.dispatchEvent(errorEvent);
    } finally {
      console.log('🏁 [CITATION] Processing completed for:', targetDocumentId);
      setIsProcessing(false);
      // Remove from processing queue
      setProcessingQueue(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetDocumentId);
        console.log('🗑️ [CITATION] Removed from processing queue:', targetDocumentId, 'Queue size:', newSet.size);
        return newSet;
      });
    }
  }, [callChatGPT, currentDocumentId, autoProcessEnabled, processingQueue, isProcessing, citationResultsMap]);

  const clearResults = useCallback(() => {
    console.log('🧹 [CITATION] Clearing citation results for current document:', currentDocumentId);
    if (currentDocumentId) {
      setCitationResultsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(currentDocumentId);
        console.log('🗑️ [CITATION] Removed results for:', currentDocumentId, 'Remaining cached documents:', newMap.size);
        return newMap;
      });
    }
    setError(null);
    setProcessingQueue(new Set());
  }, [currentDocumentId]);

  const clearAllResults = useCallback(() => {
    console.log('🧹 [CITATION] Clearing all citation results');
    setCitationResultsMap(new Map());
    setError(null);
    setCurrentDocumentId(null);
    setProcessingQueue(new Set());
  }, []);

  const toggleAutoProcess = useCallback(() => {
    const newState = !autoProcessEnabled;
    console.log('🔄 [CITATION] Toggling auto-process:', newState ? 'ENABLED' : 'DISABLED');
    setAutoProcessEnabled(newState);
  }, [autoProcessEnabled]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('📊 [CITATION] State update:', {
      isProcessing,
      currentDocumentId,
      hasResults: !!citationResults,
      resultsCount: Array.isArray(citationResults) ? citationResults.length : 0,
      totalCachedDocuments: citationResultsMap.size,
      hasError: !!error,
      autoProcessEnabled,
      queueSize: processingQueue.size
    });
  }, [isProcessing, citationResults, currentDocumentId, citationResultsMap.size, error, autoProcessEnabled, processingQueue.size]);

  return {
    isProcessing,
    citationResults,
    error,
    autoProcessEnabled,
    currentDocumentId,
    processingQueue: processingQueue.size,
    totalCachedResults: citationResultsMap.size,
    processCitations,
    clearResults,
    clearAllResults,
    toggleAutoProcess
  };
};
