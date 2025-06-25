
import React from 'react';
import { CitationExtraction } from '@/hooks/useCitationExtractor';

interface CitationHighlighterProps {
  content: string;
  citations: CitationExtraction[];
  onCitationClick: (citation: CitationExtraction) => void;
}

const CitationHighlighter: React.FC<CitationHighlighterProps> = ({
  content,
  citations,
  onCitationClick
}) => {
  // Sort citations by position to process them in order
  const sortedCitations = [...citations].sort((a, b) => {
    const aAnchorPos = content.indexOf(`⟦${a.anchor}⟧`);
    const bAnchorPos = content.indexOf(`⟦${b.anchor}⟧`);
    if (aAnchorPos !== bAnchorPos) {
      return aAnchorPos - bAnchorPos;
    }
    return a.start_offset - b.start_offset;
  });

  // Create highlighted content
  let result = '';
  let lastPos = 0;

  sortedCitations.forEach((citation, index) => {
    const anchorPattern = `⟦${citation.anchor}⟧`;
    const anchorPos = content.indexOf(anchorPattern, lastPos);
    
    if (anchorPos === -1) return;
    
    const citationStart = anchorPos + anchorPattern.length + citation.start_offset;
    const citationEnd = anchorPos + anchorPattern.length + citation.end_offset;
    
    // Add content before this citation
    result += content.substring(lastPos, citationStart);
    
    // Determine highlight color based on status
    let highlightClass = '';
    let statusLabel = '';
    
    switch (citation.status) {
      case 'Correct':
        highlightClass = 'bg-green-200 border-green-400 hover:bg-green-300';
        statusLabel = 'Correct';
        break;
      case 'Uncertain':
        highlightClass = 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300';
        statusLabel = 'Uncertain';
        break;
      case 'Error':
        highlightClass = 'bg-red-200 border-red-400 hover:bg-red-300';
        statusLabel = 'Error';
        break;
      default:
        highlightClass = 'bg-gray-200 border-gray-400 hover:bg-gray-300';
        statusLabel = 'Unknown';
    }
    
    // Add highlighted citation
    const citationText = content.substring(citationStart, citationEnd);
    result += `<span 
      class="citation-highlight ${highlightClass} border-2 rounded px-1 cursor-pointer transition-colors"
      data-citation-index="${index}"
      title="Citation: ${statusLabel} - Click for details"
    >${citationText}</span>`;
    
    lastPos = citationEnd;
  });
  
  // Add remaining content
  result += content.substring(lastPos);

  // Handle citation clicks
  const handleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('citation-highlight')) {
      const citationIndex = parseInt(target.getAttribute('data-citation-index') || '0');
      const citation = sortedCitations[citationIndex];
      if (citation) {
        onCitationClick(citation);
      }
    }
  };

  return (
    <div 
      className="citation-highlighted-content"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: result.split(/(⟦P-\d{5}⟧)/).map((part, index) => {
        if (part.match(/⟦P-\d{5}⟧/)) {
          return `<span class="bg-yellow-100 text-yellow-800 px-1 rounded text-xs font-bold border border-yellow-300 anchor-token">${part}</span>`;
        }
        return part;
      }).join('') }}
    />
  );
};

export default CitationHighlighter;
