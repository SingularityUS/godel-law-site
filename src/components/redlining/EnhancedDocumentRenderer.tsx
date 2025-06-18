/**
 * Enhanced Document Renderer Component
 * 
 * Purpose: Renders documents with original formatting and inline redline suggestions
 */

import React, { useEffect, useState } from "react";
import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { extractDocumentContent } from "@/components/DocumentPreview/documentUtils";

interface EnhancedDocumentRendererProps {
  document: RedlineDocument;
  originalDocument: { type: string; preview?: string };
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
}

const EnhancedDocumentRenderer: React.FC<EnhancedDocumentRendererProps> = ({
  document,
  originalDocument,
  suggestions,
  selectedSuggestionId,
  onSuggestionClick
}) => {
  const [richContent, setRichContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRichContent = async () => {
      setIsLoading(true);
      try {
        console.log('Loading rich content for redlining');
        console.log('Document original content length:', document.originalContent.length);
        console.log('Suggestions count:', suggestions.length);
        
        let baseContent = '';
        
        // Try to get the best available content
        if (originalDocument?.preview) {
          console.log('Using original document preview');
          const content = await extractDocumentContent(originalDocument);
          baseContent = content;
        } else if (document.originalContent && document.originalContent.trim().length > 0) {
          console.log('Using document original content');
          baseContent = document.originalContent;
        } else {
          console.log('Using document current content as fallback');
          baseContent = document.currentContent;
        }
        
        // Validate that we have meaningful content
        if (!baseContent || baseContent.trim().length === 0) {
          console.warn('No meaningful content found for redlining');
          baseContent = 'No document content available for redlining.';
        }
        
        console.log('Base content preview:', baseContent.substring(0, 200) + '...');
        
        // Apply redline markup to the full content
        const enhancedContent = injectRedlineMarkup(baseContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
        
      } catch (error) {
        console.error('Error loading rich content:', error);
        // Use document content as absolute fallback
        const fallbackContent = document.originalContent || document.currentContent || 'Error loading document content.';
        const enhancedContent = injectRedlineMarkup(fallbackContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadRichContent();
  }, [document, originalDocument, suggestions, selectedSuggestionId]);

  const injectRedlineMarkup = (content: string, suggestions: RedlineSuggestion[], selectedId: string | null): string => {
    console.log(`Injecting redline markup into content (${content.length} chars) with ${suggestions.length} suggestions`);
    
    if (!content || content.trim().length === 0) {
      return '<p>No content available</p>';
    }
    
    let enhancedContent = content;
    
    // Sort suggestions by position (reverse order to maintain positions)
    const validSuggestions = suggestions.filter(s => 
      s.status === 'pending' && 
      s.startPos !== undefined && 
      s.endPos !== undefined &&
      s.startPos >= 0 && 
      s.endPos <= content.length &&
      s.startPos < s.endPos
    );
    
    console.log(`Applying ${validSuggestions.length} valid suggestions`);
    
    const sortedSuggestions = [...validSuggestions].sort((a, b) => b.startPos - a.startPos);
    
    sortedSuggestions.forEach((suggestion, index) => {
      try {
        const beforeText = enhancedContent.substring(0, suggestion.startPos);
        const originalText = enhancedContent.substring(suggestion.startPos, suggestion.endPos);
        const afterText = enhancedContent.substring(suggestion.endPos);
        
        // Validate that we're highlighting the expected text
        const expectedText = suggestion.originalText;
        if (expectedText && originalText.trim() !== expectedText.trim()) {
          console.warn(`Text mismatch for suggestion ${suggestion.id}: expected "${expectedText}" but found "${originalText}"`);
        }
        
        const isSelected = selectedId === suggestion.id;
        const severityClass = getSeverityClass(suggestion.severity);
        const typeClass = getTypeClass(suggestion.type);
        
        const redlineMarkup = `<span 
            class="redline-suggestion ${severityClass} ${typeClass} ${isSelected ? 'selected' : ''}" 
            data-suggestion-id="${suggestion.id}"
            data-type="${suggestion.type}"
            data-severity="${suggestion.severity}"
            title="${escapeHtml(suggestion.explanation)}"
          >
            <span class="original-text">${escapeHtml(originalText)}</span>
            <span class="suggested-text">${escapeHtml(suggestion.suggestedText)}</span>
            <span class="redline-indicator">${getTypeIcon(suggestion.type)}</span>
          </span>`;
        
        enhancedContent = beforeText + redlineMarkup + afterText;
        
        console.log(`Applied suggestion ${index + 1}/${sortedSuggestions.length}: "${originalText.substring(0, 30)}..."`);
        
      } catch (error) {
        console.error(`Error applying suggestion ${suggestion.id}:`, error);
      }
    });
    
    // Convert plain text formatting to HTML while preserving redlines
    enhancedContent = preserveFormattingAsHtml(enhancedContent);
    
    console.log('Redline markup injection complete');
    return enhancedContent;
  };

  /**
   * Converts plain text to HTML while preserving redline markup
   */
  const preserveFormattingAsHtml = (content: string): string => {
    // Convert line breaks to HTML, but be careful not to break redline markup
    return content
      .split('\n')
      .map(line => line.trim() === '' ? '<br>' : `<p>${line}</p>`)
      .join('');
  };

  /**
   * Escapes HTML characters to prevent XSS
   */
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-medium';
    }
  };

  const getTypeClass = (type: string): string => {
    switch (type) {
      case 'grammar': return 'type-grammar';
      case 'style': return 'type-style';
      case 'legal': return 'type-legal';
      case 'clarity': return 'type-clarity';
      default: return 'type-grammar';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'grammar': return '✓';
      case 'style': return '✦';
      case 'legal': return '⚖';
      case 'clarity': return '💡';
      default: return '✓';
    }
  };

  const handleContentClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const suggestionElement = target.closest('.redline-suggestion');
    
    if (suggestionElement) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
      if (suggestionId) {
        onSuggestionClick(suggestionId);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document with redlines...</p>
        </div>
      </div>
    );
  }

  const redlineStyles = `
    .redline-suggestion {
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 2px;
      padding: 1px 2px;
      display: inline;
    }
    
    .redline-suggestion:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 10;
    }
    
    .redline-suggestion.selected {
      box-shadow: 0 0 0 2px #3b82f6;
      z-index: 20;
    }
    
    .original-text {
      text-decoration: line-through;
      opacity: 0.7;
      color: #dc2626;
    }
    
    .suggested-text {
      background-color: #dcfce7;
      color: #166534;
      font-weight: 500;
      margin-left: 4px;
    }
    
    .redline-indicator {
      display: inline-block;
      margin-left: 2px;
      font-size: 10px;
      opacity: 0.7;
    }
    
    /* Severity styles */
    .severity-high {
      background-color: #fef2f2;
      border-left: 3px solid #dc2626;
    }
    
    .severity-medium {
      background-color: #fefce8;
      border-left: 3px solid #ca8a04;
    }
    
    .severity-low {
      background-color: #f0fdf4;
      border-left: 3px solid #16a34a;
    }
    
    /* Type styles */
    .type-grammar { border-color: #3b82f6; }
    .type-style { border-color: #8b5cf6; }
    .type-legal { border-color: #f97316; }
    .type-clarity { border-color: #06b6d4; }
  `;

  return (
    <div className="bg-gray-100 min-h-full">
      <style dangerouslySetInnerHTML={{ __html: redlineStyles }} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg p-16 relative min-h-[800px]">
          <div 
            className="prose prose-sm max-w-none"
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: richContent }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedDocumentRenderer;
