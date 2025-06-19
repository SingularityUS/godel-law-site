
/**
 * useRedlineContent Hook
 * 
 * Purpose: Enhanced content processing with systematic debugging for original content display
 */

import { useEffect, useState } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { extractDocumentContent } from "@/components/DocumentPreview/documentUtils";
import { hasHtmlMarkup, convertTextToHtml } from "../utils/htmlUtils";

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
        console.log('=== LOADING RICH CONTENT (Systematic Debug Phase 1) ===');
        console.log('Goal: Display full original document content WITHOUT suggestions first');
        
        // Log all available content sources
        console.log('Available content sources:');
        console.log('1. Original document preview:', {
          hasPreview: !!originalDocument?.preview,
          previewLength: originalDocument?.preview?.length || 0,
          previewType: originalDocument?.type,
          previewStart: originalDocument?.preview?.substring(0, 100)
        });
        
        console.log('2. Document current content:', {
          hasCurrentContent: !!document.currentContent,
          currentContentLength: document.currentContent?.length || 0,
          currentContentStart: document.currentContent?.substring(0, 100)
        });
        
        console.log('3. Document original content:', {
          hasOriginalContent: !!document.originalContent,
          originalContentLength: document.originalContent?.length || 0,
          originalContentStart: document.originalContent?.substring(0, 100)
        });
        
        console.log('4. Suggestions:', {
          suggestionCount: suggestions.length,
          suggestionIds: suggestions.map(s => s.id)
        });
        
        let baseContent = '';
        let contentSource = 'none';
        
        // PHASE 1: PRIORITY - Use original document preview (this should have full content)
        if (originalDocument?.preview && originalDocument.preview.trim().length > 0) {
          console.log('🎯 PHASE 1: Attempting to extract from original document preview...');
          try {
            baseContent = await extractDocumentContent(originalDocument);
            contentSource = 'original-document-preview';
            console.log('✅ Successfully extracted from original document preview:', {
              extractedLength: baseContent.length,
              hasHtml: hasHtmlMarkup(baseContent),
              contentStart: baseContent.substring(0, 200)
            });
          } catch (error) {
            console.error('❌ Failed to extract from original document preview:', error);
            // Don't fallback yet, let's try the raw preview
            if (originalDocument.preview.length > 50) {
              baseContent = originalDocument.preview;
              contentSource = 'raw-original-preview';
              console.log('✅ Using raw original document preview as fallback');
            }
          }
        }
        
        // PHASE 1: FALLBACK - Use stored content only if preview failed
        if (!baseContent || baseContent.length < 50) {
          console.log('⚠️ Original document preview insufficient, checking stored content...');
          
          if (document.currentContent && document.currentContent.length > 50) {
            baseContent = document.currentContent;
            contentSource = 'document-current-content';
            console.log('Using document current content as fallback');
          } else if (document.originalContent && document.originalContent.length > 50) {
            baseContent = document.originalContent;
            contentSource = 'document-original-content';
            console.log('Using document original content as fallback');
          }
        }
        
        // Validate we have meaningful content
        if (!baseContent || baseContent.trim().length === 0) {
          console.error('❌ No meaningful content found from any source');
          baseContent = 'No document content available for redlining.';
          contentSource = 'error-fallback';
        }
        
        console.log('=== CONTENT SELECTION RESULT ===');
        console.log('Selected source:', contentSource);
        console.log('Content length:', baseContent.length);
        console.log('Content type:', hasHtmlMarkup(baseContent) ? 'HTML' : 'Plain text');
        console.log('Content preview (first 300 chars):', baseContent.substring(0, 300));
        console.log('Content preview (last 100 chars):', baseContent.slice(-100));
        
        // PHASE 1: DISPLAY ORIGINAL CONTENT ONLY (no suggestions for now)
        console.log('🎯 PHASE 1: Displaying original content WITHOUT suggestions for debugging');
        
        let finalContent = baseContent;
        
        // Ensure content is in HTML format for proper display
        if (!hasHtmlMarkup(finalContent)) {
          console.log('Converting plain text to HTML for display...');
          finalContent = convertTextToHtml(finalContent);
        }
        
        console.log('=== FINAL CONTENT READY ===');
        console.log('Final content length:', finalContent.length);
        console.log('Final content type:', hasHtmlMarkup(finalContent) ? 'HTML' : 'Plain text');
        console.log('Final content preview:', finalContent.substring(0, 400));
        
        setRichContent(finalContent);
        
      } catch (error) {
        console.error('❌ Error loading rich content:', error);
        
        // Emergency fallback
        const emergencyContent = document.currentContent || 
                               document.originalContent || 
                               originalDocument?.preview ||
                               'Error loading document content.';
        
        console.log('Using emergency fallback content:', {
          source: emergencyContent === document.currentContent ? 'document.currentContent' :
                  emergencyContent === document.originalContent ? 'document.originalContent' :
                  emergencyContent === originalDocument?.preview ? 'originalDocument.preview' : 'error',
          length: emergencyContent.length
        });
        
        const finalEmergencyContent = hasHtmlMarkup(emergencyContent) ? 
                                    emergencyContent : 
                                    convertTextToHtml(emergencyContent);
        
        setRichContent(finalEmergencyContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadRichContent();
  }, [document, originalDocument]); // Removed suggestions from dependencies to focus on original content

  return { richContent, isLoading };
};
