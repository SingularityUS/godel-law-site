
/**
 * useRedlineContent Hook
 * 
 * Purpose: Enhanced content processing that preserves original document structure and text
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
        console.log('=== LOADING RICH CONTENT (Structure & Text Preserving) ===');
        console.log('Document current content length:', document.currentContent?.length || 0);
        console.log('Document original content length:', document.originalContent?.length || 0);
        console.log('Suggestions count:', suggestions.length);
        console.log('Original document type:', originalDocument?.type);
        console.log('Has original document preview:', !!originalDocument?.preview);
        
        let baseContent = '';
        let contentSource = 'unknown';
        
        // PRIORITY 1: Use rich formatted content from original document
        if (originalDocument?.preview && originalDocument.preview.trim().length > 0) {
          console.log('Extracting rich formatted content from original document preview');
          try {
            baseContent = await extractDocumentContent(originalDocument);
            contentSource = 'enhanced-original-preview';
            console.log('Successfully extracted enhanced formatted content');
            console.log('Preview content length:', baseContent.length);
            console.log('Preview content type:', baseContent.includes('<') ? 'HTML' : 'Plain text');
          } catch (error) {
            console.warn('Failed to extract enhanced content from preview:', error);
            // Fallback to stored content
            baseContent = document.currentContent || document.originalContent || '';
            contentSource = 'fallback-stored-after-preview-error';
          }
        }
        // PRIORITY 2: Use currentContent to preserve manual edits
        else if (document.currentContent && document.currentContent.trim().length > 0) {
          console.log('Using document current content (preserves manual edits)');
          baseContent = document.currentContent;
          contentSource = 'current-content';
        } 
        // PRIORITY 3: Use originalContent 
        else if (document.originalContent && document.originalContent.trim().length > 0) {
          console.log('Using document original content');
          baseContent = document.originalContent;
          contentSource = 'original-content';
        }
        // FALLBACK: Error state
        else {
          console.warn('No meaningful content found for redlining');
          baseContent = 'No document content available for redlining.';
          contentSource = 'error-fallback';
        }
        
        // Validate that we have meaningful content
        if (!baseContent || baseContent.trim().length === 0) {
          console.warn('Content is empty after extraction');
          baseContent = 'No document content available for redlining.';
          contentSource = 'empty-fallback';
        }
        
        console.log('Final content analysis:', {
          source: contentSource,
          type: typeof baseContent,
          length: baseContent.length,
          hasHtmlTags: /<[^>]+>/.test(baseContent),
          hasRedlineMarkup: /redline-suggestion/.test(baseContent),
          preview: baseContent.substring(0, 300).replace(/\n/g, '\\n')
        });
        
        // Apply redline markup to the content while preserving structure and original text
        console.log('Applying redline markup while preserving structure and original text...');
        const enhancedContent = injectRedlineMarkup(baseContent, suggestions, selectedSuggestionId);
        
        console.log('Enhanced content generated:', {
          originalLength: baseContent.length,
          enhancedLength: enhancedContent.length,
          hasRedlineMarkup: /redline-suggestion/.test(enhancedContent),
          structurePreserved: enhancedContent.includes(baseContent.substring(0, 100).replace(/<[^>]*>/g, '')),
          preview: enhancedContent.substring(0, 400).replace(/\n/g, '\\n')
        });
        
        setRichContent(enhancedContent);
        
      } catch (error) {
        console.error('Error loading rich content:', error);
        // Use current content as absolute fallback
        const fallbackContent = document.currentContent || document.originalContent || 'Error loading document content.';
        console.log('Using fallback content:', fallbackContent.substring(0, 200));
        
        try {
          const enhancedContent = injectRedlineMarkup(fallbackContent, suggestions, selectedSuggestionId);
          setRichContent(enhancedContent);
        } catch (fallbackError) {
          console.error('Error in fallback content processing:', fallbackError);
          setRichContent(fallbackContent);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRichContent();
  }, [document, originalDocument, suggestions, selectedSuggestionId]);

  return { richContent, isLoading };
};
