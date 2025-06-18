
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
        if (originalDocument?.preview) {
          const content = await extractDocumentContent(originalDocument);
          const enhancedContent = injectRedlineMarkup(content, suggestions, selectedSuggestionId);
          setRichContent(enhancedContent);
        } else {
          // Fallback to current content with basic formatting
          const enhancedContent = injectRedlineMarkup(document.currentContent, suggestions, selectedSuggestionId);
          setRichContent(enhancedContent);
        }
      } catch (error) {
        console.error('Error loading rich content:', error);
        // Fallback to basic content
        const enhancedContent = injectRedlineMarkup(document.currentContent, suggestions, selectedSuggestionId);
        setRichContent(enhancedContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadRichContent();
  }, [document, originalDocument, suggestions, selectedSuggestionId]);

  const injectRedlineMarkup = (content: string, suggestions: RedlineSuggestion[], selectedId: string | null): string => {
    let enhancedContent = content;
    
    // Sort suggestions by position (reverse order to maintain positions)
    const sortedSuggestions = [...suggestions].sort((a, b) => b.startPos - a.startPos);
    
    sortedSuggestions.forEach(suggestion => {
      if (suggestion.status === 'pending' && suggestion.startPos !== undefined && suggestion.endPos !== undefined) {
        const beforeText = enhancedContent.substring(0, suggestion.startPos);
        const originalText = enhancedContent.substring(suggestion.startPos, suggestion.endPos);
        const afterText = enhancedContent.substring(suggestion.endPos);
        
        const isSelected = selectedId === suggestion.id;
        const severityClass = getSeverityClass(suggestion.severity);
        const typeClass = getTypeClass(suggestion.type);
        
        const redlineMarkup = `
          <span 
            class="redline-suggestion ${severityClass} ${typeClass} ${isSelected ? 'selected' : ''}" 
            data-suggestion-id="${suggestion.id}"
            data-type="${suggestion.type}"
            data-severity="${suggestion.severity}"
            title="${suggestion.explanation}"
          >
            <span class="original-text">${originalText}</span>
            <span class="suggested-text">${suggestion.suggestedText}</span>
            <span class="redline-indicator">${getTypeIcon(suggestion.type)}</span>
          </span>
        `;
        
        enhancedContent = beforeText + redlineMarkup + afterText;
      }
    });
    
    return enhancedContent;
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

  return (
    <>
      <style jsx>{`
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
      `}</style>
      
      <div className="bg-gray-100 min-h-full">
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
    </>
  );
};

export default EnhancedDocumentRenderer;
