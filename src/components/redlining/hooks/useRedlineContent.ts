
/**
 * useRedlineContent Hook
 * 
 * Purpose: Manages loading and processing of redline content with controlled whitespace management
 */

import { useEffect, useState } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { extractDocumentContent } from "@/components/DocumentPreview/documentUtils";
import { injectRedlineMarkup } from "../utils/redlineMarkupUtils";

interface UseRedlineContentProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
}

export const useRedlineContent = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId
}: UseRedlineContentProps) => {
  const [richContent, setRichContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRichContent = async () => {
      setIsLoading(true);
      try {
        console.log('Loading rich content with controlled whitespace management');
        console.log('Document current content length:', document.currentContent.length);
        console.log('Document original content length:', document.originalContent.length);
        console.log('Suggestions count:', suggestions.length);
        
        let baseContent = '';
        
        // PRIORITY: Use currentContent to preserve manual edits AND formatting
        if (document.currentContent && document.currentContent.length > 0) {
          console.log('Using document current content (preserves manual edits AND formatting)');
          baseContent = document.currentContent;
          
          // Log formatting details for debugging
          console.log('Current content formatting:', {
            hasLineBreaks: baseContent.includes('\n'),
            hasDoubleLineBreaks: baseContent.includes('\n\n'),
            hasMultipleSpaces: baseContent.includes('  '),
            startsWithWhitespace: /^\s/.test(baseContent),
            endsWithWhitespace: /\s$/.test(baseContent)
          });
        } 
        // FALLBACK 1: Use originalContent (should have preserved formatting)
        else if (document.originalContent && document.originalContent.length > 0) {
          console.log('Using document original content (preserves formatting)');
          baseContent = document.originalContent;
        }
        // FALLBACK 2: Extract from original document preview
        else if (originalDocument?.preview) {
          console.log('Using original document preview as fallback');
          const content = await extractDocumentContent(originalDocument);
          baseContent = content;
        } 
        // FALLBACK 3: Error state
        else {
          console.log('No meaningful content found for redlining');
          baseContent = 'No document content available for redlining.';
        }
        
        // Validate that we have meaningful content
        if (!baseContent || baseContent.length === 0) {
          console.warn('No meaningful content found for redlining');
          baseContent = 'No document content available for redlining.';
        }
        
        console.log('Base content preview (first 200 chars):', JSON.stringify(baseContent.substring(0, 200)));
        console.log('Base content formatting preserved:', {
          totalLength: baseContent.length,
          lineBreaks: (baseContent.match(/\n/g) || []).length,
          paragraphBreaks: (baseContent.match(/\n\n/g) || []).length,
          leadingSpaces: baseContent.match(/^\s*/)?.[0]?.length || 0,
          trailingSpaces: baseContent.match(/\s*$/)?.[0]?.length || 0
        });
        
        // Apply redline markup to the current content (preserving all formatting)
        const enhancedContent = injectRedlineMarkup(baseContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
        
      } catch (error) {
        console.error('Error loading rich content:', error);
        // Use current content as absolute fallback to preserve manual edits and formatting
        const fallbackContent = document.currentContent || document.originalContent || 'Error loading document content.';
        const enhancedContent = injectRedlineMarkup(fallbackContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadRichContent();
  }, [document, originalDocument, suggestions, selectedSuggestionId]);

  return { richContent, isLoading };
};
