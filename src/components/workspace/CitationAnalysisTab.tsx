
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { CitationAnalysisResult } from '@/hooks/useCitationAnalyzer';

interface CitationAnalysisTabProps {
  result: CitationAnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  hasDocument: boolean;
}

const CitationAnalysisTab: React.FC<CitationAnalysisTabProps> = ({
  result,
  isAnalyzing,
  onAnalyze,
  hasDocument
}) => {
  const renderJsonData = (data: any) => {
    if (typeof data === 'string') {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Raw Response:</p>
          <pre className="text-xs whitespace-pre-wrap font-mono bg-white p-3 rounded border max-h-96 overflow-auto">
            {data}
          </pre>
        </div>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium">Citations Found: {data.length}</p>
          {data.map((citation, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{citation.type || 'Unknown'}</Badge>
                    <span className="text-xs text-gray-500">
                      {citation.anchor || `Citation ${index + 1}`}
                    </span>
                  </div>
                  
                  {citation.orig && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">Original:</p>
                      <p className="text-sm bg-red-50 p-2 rounded">{citation.orig}</p>
                    </div>
                  )}
                  
                  {citation.suggested && citation.suggested !== citation.orig && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">Suggested:</p>
                      <p className="text-sm bg-green-50 p-2 rounded">{citation.suggested}</p>
                    </div>
                  )}
                  
                  {citation.status && (
                    <div className="flex items-center gap-1">
                      {citation.status === 'Correct' && <CheckCircle size={14} className="text-green-600" />}
                      {citation.status === 'Error' && <AlertTriangle size={14} className="text-red-600" />}
                      {citation.status === 'Uncertain' && <AlertTriangle size={14} className="text-yellow-600" />}
                      <span className="text-xs">{citation.status}</span>
                    </div>
                  )}
                  
                  {citation.errors && citation.errors.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600">Errors:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {citation.errors.map((error: string, errorIndex: number) => (
                          <li key={errorIndex}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">JSON Data:</p>
        <pre className="text-xs whitespace-pre-wrap font-mono bg-white p-3 rounded border max-h-96 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              Citation Analysis
              {result && (
                <Badge variant="outline">
                  {result.documentName}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onAnalyze}
                disabled={isAnalyzing || !hasDocument}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Citations'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full p-6">
            {!hasDocument && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                  <p className="text-sm">Upload a document with anchor tokens to analyze citations</p>
                </div>
              </div>
            )}

            {hasDocument && !result && !isAnalyzing && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-gray-500">
                  <Search size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-sm">Click "Analyze Citations" to start the analysis</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-blue-600">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2">Analyzing Citations</h3>
                  <p className="text-sm">GPT-4.1 is analyzing your document...</p>
                  <p className="text-xs text-gray-500 mt-2">Check browser console for detailed logs</p>
                </div>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="space-y-6">
                {result.success ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={20} />
                      <span className="font-medium">Analysis Completed Successfully</span>
                    </div>
                    {renderJsonData(result.parsedData)}
                    
                    {result.rawResponse && result.rawResponse !== JSON.stringify(result.parsedData) && (
                      <div className="mt-6">
                        <p className="text-sm font-medium text-gray-600 mb-2">Raw GPT Response:</p>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border max-h-48 overflow-auto">
                          {result.rawResponse}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-red-600">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={20} />
                      <span className="font-medium">Analysis Failed</span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Error Details:</p>
                      <p className="text-sm">{result.error || 'Unknown error occurred'}</p>
                      <p className="text-xs text-gray-600 mt-2">Check browser console for more details</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitationAnalysisTab;
