
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, XCircle, FileText } from 'lucide-react';
import { CitationExtractionResult } from '@/hooks/useCitationExtractor';
import CitationHighlighter from './CitationHighlighter';
import CitationDetailModal from './CitationDetailModal';
import { useState } from 'react';

interface CitationResultsPanelProps {
  result: CitationExtractionResult;
  documentContent: string;
}

const CitationResultsPanel: React.FC<CitationResultsPanelProps> = ({
  result,
  documentContent
}) => {
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCitationClick = (citation: any) => {
    setSelectedCitation(citation);
    setIsModalOpen(true);
  };

  const getStatusStats = () => {
    const stats = {
      correct: 0,
      uncertain: 0,
      error: 0
    };

    result.citations.forEach(citation => {
      switch (citation.status.toLowerCase()) {
        case 'correct':
          stats.correct++;
          break;
        case 'uncertain':
          stats.uncertain++;
          break;
        case 'error':
          stats.error++;
          break;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              Citation Analysis: {result.documentName}
            </div>
            <Badge variant="outline">
              {result.totalCitations} citations found
            </Badge>
          </CardTitle>

          {/* Status Summary */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="text-green-600" />
              <span>{stats.correct} Correct</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle size={16} className="text-yellow-600" />
              <span>{stats.uncertain} Uncertain</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle size={16} className="text-red-600" />
              <span>{stats.error} Errors</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full p-6">
            <CitationHighlighter
              content={documentContent}
              citations={result.citations}
              onCitationClick={handleCitationClick}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      <CitationDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        citation={selectedCitation}
      />
    </div>
  );
};

export default CitationResultsPanel;
