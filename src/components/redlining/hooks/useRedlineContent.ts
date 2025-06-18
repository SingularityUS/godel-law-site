
/**
 * useRedlineContent Hook
 * 
 * Purpose: Manages loading and processing of redline content with enhanced document formatting
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
        console.log('Loading rich content with enhanced document formatting');
        console.log('Document current content length:', document.currentContent.length);
        console.log('Document original content length:', document.originalContent.length);
        console.log('Suggestions count:', suggestions.length);
        
        let baseContent = '';
        
        // PRIORITY 1: Use enhanced formatted content from original document
        if (originalDocument?.preview) {
          console.log('Extracting enhanced formatted content from original document');
          try {
            baseContent = await extractDocumentContent(originalDocument);
            console.log('Successfully extracted enhanced formatted content');
          } catch (error) {
            console.warn('Failed to extract enhanced content, falling back to stored content:', error);
            baseContent = document.currentContent || document.originalContent || '';
          }
        }
        // FALLBACK 1: Use currentContent to preserve manual edits
        else if (document.currentContent && document.currentContent.length > 0) {
          console.log('Using document current content (preserves manual edits)');
          baseContent = document.currentContent;
        } 
        // FALLBACK 2: Use originalContent 
        else if (document.originalContent && document.originalContent.length > 0) {
          console.log('Using document original content');
          baseContent = document.originalContent;
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
        
        console.log('Base content type:', typeof baseContent);
        console.log('Base content preview (first 200 chars):', JSON.stringify(baseContent.substring(0, 200)));
        console.log('Base content has HTML tags:', /<[^>]+>/.test(baseContent));
        
        // Apply redline markup to the enhanced formatted content
        const enhancedContent = injectRedlineMarkup(baseContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
        
      } catch (error) {
        console.error('Error loading rich content:', error);
        // Use current content as absolute fallback
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
