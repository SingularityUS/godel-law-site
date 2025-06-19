
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
        console.log('=== LOADING RICH CONTENT (Enhanced for Full Document) ===');
        console.log('🎯 Goal: Display complete original document content');
        
        // Log all available content sources with enhanced debugging
        console.log('Available content sources:');
        console.log('1. Original document preview:', {
          hasPreview: !!originalDocument?.preview,
          previewLength: originalDocument?.preview?.length || 0,
          previewType: originalDocument?.type,
          previewStart: originalDocument?.preview?.substring(0, 100),
          isFullContent: (originalDocument?.preview?.length || 0) > 100 // Detect if this looks like full content
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
        
        let baseContent = '';
        let contentSource = 'none';
        
        // PRIORITY 1: Use original document preview if it contains substantial content
        if (originalDocument?.preview && originalDocument.preview.trim().length > 100) {
          console.log('✅ PRIORITY 1: Using original document preview (full content detected)');
          try {
            // If it's already formatted content, use it directly
            if (hasHtmlMarkup(originalDocument.preview) || originalDocument.preview.length > 500) {
              baseContent = originalDocument.preview;
              contentSource = 'direct-original-preview';
              console.log('Using direct original preview content');
            } else {
              // Try to extract if it's a structured document
              baseContent = await extractDocumentContent(originalDocument);
              contentSource = 'extracted-original-preview';
              console.log('Extracted from original document preview');
            }
          } catch (error) {
            console.warn('❌ Failed to extract from original document preview, using raw:', error);
            baseContent = originalDocument.preview;
            contentSource = 'raw-original-preview';
          }
        }
        
        // PRIORITY 2: Use document original content if preview is insufficient
        else if (document.originalContent && document.originalContent.length > 100) {
          console.log('✅ PRIORITY 2: Using document original content');
          baseContent = document.originalContent;
          contentSource = 'document-original-content';
        }
        
        // PRIORITY 3: Use document current content as fallback
        else if (document.currentContent && document.currentContent.length > 100) {
          console.log('✅ PRIORITY 3: Using document current content');
          baseContent = document.currentContent;
          contentSource = 'document-current-content';
        }
        
        // PRIORITY 4: Emergency fallback to any available content
        else if (originalDocument?.preview && originalDocument.preview.length > 0) {
          console.log('⚠️ PRIORITY 4: Using short original preview as emergency fallback');
          baseContent = originalDocument.preview;
          contentSource = 'emergency-original-preview';
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
        
        // Display original content for redline overlay
        console.log('🎯 Preparing content for redline display');
        
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
        
        // Emergency fallback with priority order
        const emergencyContent = originalDocument?.preview || 
                               document.originalContent || 
                               document.currentContent || 
                               'Error loading document content.';
        
        console.log('Using emergency fallback content:', {
          source: emergencyContent === originalDocument?.preview ? 'originalDocument.preview' :
                  emergencyContent === document.originalContent ? 'document.originalContent' :
                  emergencyContent === document.currentContent ? 'document.currentContent' : 'error',
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
  }, [document, originalDocument]); // Focus on original content, not suggestions

  return { richContent, isLoading };
};
