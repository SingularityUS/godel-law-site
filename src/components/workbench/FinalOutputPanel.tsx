
/**
 * FinalOutputPanel Component
 * 
 * Purpose: Displays the final output of legal document pipeline execution
 * Enhanced for legal document processing with structured analysis display
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, X, Maximize2, Minimize2, FileText, Scale, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinalOutputPanelProps {
  output: any;
  onClose: () => void;
}

const FinalOutputPanel: React.FC<FinalOutputPanelProps> = ({
  output,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!output) return null;

  const isLegalPipeline = output.summary?.pipelineType === "Legal Document Analysis";

  const formatOutput = (data: any): string => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderLegalResults = () => {
    if (!isLegalPipeline || !output.results) {
      return <div>No legal analysis results available</div>;
    }

    return (
      <Tabs defaultValue="summary" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="grammar">Grammar</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 h-full overflow-auto">
          <div className="p-4 border rounded bg-slate-50">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Scale size={18} />
              Legal Document Processing Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Documents Processed:</strong> {output.summary?.documentsProcessed || 0}
              </div>
              <div>
                <strong>Modules Executed:</strong> {output.summary?.modulesExecuted || 0}
              </div>
              <div>
                <strong>Processing Completed:</strong> {new Date(output.summary?.processingCompleted).toLocaleString()}
              </div>
              <div>
                <strong>Pipeline Type:</strong> {output.summary?.pipelineType}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Processing Steps:</h4>
            {output.results?.map((result: any, index: number) => (
              <div key={index} className="p-3 border rounded bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} />
                  <strong className="capitalize">{result.moduleType?.replace('-', ' ')}</strong>
                </div>
                <div className="text-sm text-gray-600">
                  {result.moduleType === 'document-input' 
                    ? `Loaded: ${result.result?.title}`
                    : `Processed with ${result.result?.metadata?.model || 'AI'}`
                  }
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="h-full overflow-auto">
          <div className="space-y-4">
            {output.results?.filter((r: any) => r.moduleType !== 'document-input').map((result: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">
                    {result.moduleType?.replace('-', ' ')} Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {formatOutput(result.result?.output || result.result)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grammar" className="h-full overflow-auto">
          {(() => {
            const grammarResult = output.results?.find((r: any) => r.moduleType === 'grammar-checker');
            if (!grammarResult) {
              return <div>No grammar analysis available</div>;
            }

            const grammarData = grammarResult.result?.output;
            if (!grammarData || !grammarData.analysis) {
              return <div>Grammar analysis format not recognized</div>;
            }

            return (
              <div className="space-y-4">
                <div className="p-4 border rounded bg-blue-50">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Scale size={18} />
                    Grammar Analysis Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Total Errors:</strong> {grammarData.overallAssessment?.totalErrors || 0}
                    </div>
                    <div>
                      <strong>Writing Quality:</strong> {grammarData.overallAssessment?.writingQuality || 'Unknown'}
                    </div>
                    <div>
                      <strong>Paragraphs Analyzed:</strong> {grammarData.analysis?.length || 0}
                    </div>
                  </div>
                  
                  {/* Show chunking information if available */}
                  {grammarData.chunkingInfo && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <Info size={16} />
                        <strong>Document Processing Info:</strong>
                      </div>
                      <div className="text-xs mt-1 space-y-1">
                        <div>Document was split into {grammarData.chunkingInfo.totalChunks} chunks for processing</div>
                        <div>Total paragraphs found: {grammarData.chunkingInfo.totalParagraphs}</div>
                        <div>Reassembled at: {new Date(grammarData.chunkingInfo.reassembledAt).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>

                {grammarData.analysis?.map((paragraph: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Paragraph {paragraph.paragraphId}</span>
                        {paragraph.chunkInfo && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Chunk {paragraph.chunkInfo.chunkIndex + 1}/{paragraph.chunkInfo.totalChunks}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong className="text-sm">Original:</strong>
                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          {paragraph.original}
                        </div>
                      </div>
                      
                      {paragraph.suggestions?.length > 0 && (
                        <div>
                          <strong className="text-sm">Suggestions:</strong>
                          <div className="mt-1 space-y-1">
                            {paragraph.suggestions.map((suggestion: any, sIndex: number) => (
                              <div key={sIndex} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                <div className="font-medium">{suggestion.issue}: {suggestion.severity}</div>
                                <div>{suggestion.description}</div>
                                <div className="italic">Suggestion: {suggestion.suggestion}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <strong className="text-sm">Corrected:</strong>
                        <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          {paragraph.corrected}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>Legal Writing Score: {paragraph.legalWritingScore}/10</span>
                        <span>{paragraph.improvementSummary}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="raw" className="h-full">
          <Textarea
            value={formatOutput(output)}
            readOnly
            className="w-full h-full resize-none border-none p-0 font-mono text-xs"
          />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-[600px] max-h-[600px]'} z-50`}>
      <Card className="h-full flex flex-col border-2 border-black bg-white shadow-lg">
        <CardHeader className="flex-shrink-0 border-b-2 border-black pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {isLegalPipeline ? <Scale size={20} /> : <FileText size={20} />}
              {isLegalPipeline ? 'Legal Analysis Results' : 'Pipeline Output'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(formatOutput(output))}
                className="h-6 w-6 p-0"
                title="Copy to clipboard"
              >
                <Copy size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadAsFile(
                  formatOutput(output), 
                  `legal-analysis-${new Date().toISOString().slice(0, 19)}.json`
                )}
                className="h-6 w-6 p-0"
                title="Download as file"
              >
                <Download size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-hidden">
          {isLegalPipeline ? renderLegalResults() : (
            <Textarea
              value={formatOutput(output)}
              readOnly
              className="w-full h-full resize-none border-none p-0 font-mono text-sm"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinalOutputPanel;
