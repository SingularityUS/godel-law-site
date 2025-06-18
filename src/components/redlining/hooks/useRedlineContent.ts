
/**
 * useRedlineContent Hook
 * 
 * Purpose: Manages loading and processing of redline content
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
        console.log('Loading rich content for redlining');
        console.log('Document current content length:', document.currentContent.length);
        console.log('Document original content length:', document.originalContent.length);
        console.log('Suggestions count:', suggestions.length);
        
        let baseContent = '';
        
        // FIXED: Use currentContent as primary base to preserve manual edits
        if (document.currentContent && document.currentContent.trim().length > 0) {
          console.log('Using document current content (preserves manual edits)');
          baseContent = document.currentContent;
        } else if (originalDocument?.preview) {
          console.log('Using original document preview as fallback');
          const content = await extractDocumentContent(originalDocument);
          baseContent = content;
        } else if (document.originalContent && document.originalContent.trim().length > 0) {
          console.log('Using document original content as last resort');
          baseContent = document.originalContent;
        } else {
          console.log('No meaningful content found for redlining');
          baseContent = 'No document content available for redlining.';
        }
        
        // Validate that we have meaningful content
        if (!baseContent || baseContent.trim().length === 0) {
          console.warn('No meaningful content found for redlining');
          baseContent = 'No document content available for redlining.';
        }
        
        console.log('Base content preview:', baseContent.substring(0, 200) + '...');
        
        // Apply redline markup to the current content (preserving manual edits)
        const enhancedContent = injectRedlineMarkup(baseContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
        
      } catch (error) {
        console.error('Error loading rich content:', error);
        // Use current content as absolute fallback to preserve manual edits
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
