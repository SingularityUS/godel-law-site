
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, XCircle, Copy, FileText } from 'lucide-react';
import { CitationExtraction } from '@/hooks/useCitationExtractor';
import { toast } from '@/components/ui/use-toast';

interface CitationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: CitationExtraction | null;
}

const CitationDetailModal: React.FC<CitationDetailModalProps> = ({
  isOpen,
  onClose,
  citation
}) => {
  if (!citation) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Correct':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'Uncertain':
        return <AlertCircle className="text-yellow-600" size={20} />;
      case 'Error':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <FileText className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Correct':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Uncertain':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatCitationType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(citation.orig);
      toast({
        title: "Copied",
        description: "Original citation copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopySuggested = async () => {
    try {
      await navigator.clipboard.writeText(citation.suggested);
      toast({
        title: "Copied",
        description: "Suggested citation copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const hasChanges = citation.orig !== citation.suggested;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[80vh] p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(citation.status)}
              <span>Citation Analysis</span>
              <Badge className={`${getStatusColor(citation.status)} border`}>
                {citation.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {formatCitationType(citation.type)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Anchor: {citation.anchor}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden p-6">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {/* Original Citation */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">Original Citation</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyOriginal}
                    className="flex items-center gap-1"
                  >
                    <Copy size={12} />
                    Copy
                  </Button>
                </div>
                <div className="font-mono text-sm p-3 bg-white border rounded">
                  {citation.orig}
                </div>
              </div>

              {/* Suggested Citation */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">
                    Suggested Citation
                    {!hasChanges && (
                      <span className="ml-2 text-xs text-green-600">(No changes needed)</span>
                    )}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySuggested}
                    className="flex items-center gap-1"
                  >
                    <Copy size={12} />
                    Copy
                  </Button>
                </div>
                <div className="font-mono text-sm p-3 bg-white border rounded">
                  {citation.suggested}
                </div>
                {hasChanges && (
                  <div className="mt-2 text-xs text-blue-600">
                    This citation has been corrected according to Bluebook format
                  </div>
                )}
              </div>

              {/* Errors */}
              {citation.errors && citation.errors.length > 0 && (
                <div className="border rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium text-sm mb-3 text-red-800">
                    Bluebook Rule Violations
                  </h3>
                  <div className="space-y-2">
                    {citation.errors.map((error, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Position Information */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-sm mb-3">Position Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Anchor:</span>
                    <div className="font-mono">{citation.anchor}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Citation Type:</span>
                    <div>{formatCitationType(citation.type)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Offset:</span>
                    <div className="font-mono">{citation.start_offset}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">End Offset:</span>
                    <div className="font-mono">{citation.end_offset}</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CitationDetailModal;
