import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { RedlineDocument } from "@/types/redlining";
import EmbeddedRedlineViewer from "@/components/redlining/EmbeddedRedlineViewer";
import { useRedlineDataTransform } from "@/hooks/redlining/useRedlineDataTransform";
import { toast } from "@/hooks/use-toast";
import LegalSummaryTab from "./output/LegalSummaryTab";
import LegalAnalysisTab from "./output/LegalAnalysisTab";
import GrammarAnalysisTab from "./output/GrammarAnalysisTab";
import RawDataTab from "./output/RawDataTab";

interface WorkspaceSidebarProps {
  output: any;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  output,
  isOpen,
  onClose,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState("redline");
  const [redlineDocument, setRedlineDocument] = useState<RedlineDocument | null>(null);
  const [isGeneratingRedline, setIsGeneratingRedline] = useState(false);
  const { transformGrammarData } = useRedlineDataTransform();

  // Enhanced pipeline type detection
  const isLegalPipeline = React.useMemo(() => {
    console.log('Checking pipeline type for output:', output);
    
    // Check multiple possible locations for pipeline type
    const pipelineType = output?.summary?.pipelineType || 
                        output?.metadata?.pipelineType ||
                        output?.pipelineType;
    
    const hasAnalysisData = output?.output?.analysis || 
                           output?.finalOutput?.output?.analysis ||
                           output?.analysis;
    
    console.log('Pipeline type detected:', pipelineType);
    console.log('Has analysis data:', !!hasAnalysisData);
    
    return pipelineType === "Legal Document Analysis" || !!hasAnalysisData;
  }, [output]);

  // Generate redline document when output is available
  React.useEffect(() => {
    if (output && isLegalPipeline && !redlineDocument && !isGeneratingRedline) {
      setIsGeneratingRedline(true);
      try {
        console.log('Generating redline document from output:', output);
        console.log('Output structure:', {
          hasOutput: !!output.output,
          hasAnalysis: !!output.output?.analysis,
          hasFinalOutput: !!output.finalOutput,
          finalOutputStructure: output.finalOutput ? Object.keys(output.finalOutput) : [],
          outputKeys: Object.keys(output)
        });
        
        // Try multiple data sources for redline transformation
        let transformResult = null;
        
        // First try: direct output
        if (output.output?.analysis) {
          transformResult = transformGrammarData(output);
        }
        
        // Second try: finalOutput
        if (!transformResult && output.finalOutput?.output?.analysis) {
          transformResult = transformGrammarData(output.finalOutput);
        }
        
        // Third try: nested finalOutput
        if (!transformResult && output.finalOutput?.finalOutput?.output?.analysis) {
          transformResult = transformGrammarData(output.finalOutput.finalOutput);
        }
        
        if (transformResult) {
          setRedlineDocument(transformResult);
          console.log('Redline document generated successfully');
        } else {
          console.warn('Failed to generate redline document - no valid analysis data found');
          console.log('Available data paths checked:', [
            'output.output.analysis',
            'output.finalOutput.output.analysis', 
            'output.finalOutput.finalOutput.output.analysis'
          ]);
        }
      } catch (error) {
        console.error('Error generating redline document:', error);
        toast({
          title: "Warning",
          description: "Could not generate redline document",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingRedline(false);
      }
    }
  }, [output, isLegalPipeline, redlineDocument, isGeneratingRedline, transformGrammarData]);

  const handleSaveRedline = useCallback((document: RedlineDocument) => {
    console.log('Saving redline document:', document);
    setRedlineDocument(document);
    toast({
      title: "Success",
      description: "Redline document saved successfully"
    });
  }, []);

  const handleExportRedline = useCallback((document: RedlineDocument, format: string) => {
    console.log(`Exporting redline document in ${format} format:`, document);
    toast({
      title: "Success",
      description: `Redline document exported in ${format} format`
    });
  }, []);

  if (!output) return null;

  // Handle collapsed state for resizable layout
  if (!isOpen) {
    return (
      <div className="w-12 flex flex-col border-l bg-white h-full">
        <div className="flex items-center justify-center p-4 border-b bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-l bg-white h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <h3 className="font-semibold text-gray-800">Pipeline Results</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 shrink-0 m-2">
            <TabsTrigger value="redline">Redline</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="grammar">Grammar</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="redline" className="h-full m-0">
              {isGeneratingRedline ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating redline document...</p>
                  </div>
                </div>
              ) : redlineDocument ? (
                <EmbeddedRedlineViewer
                  document={redlineDocument}
                  originalDocument={{
                    type: output.metadata?.fileType || 'text/plain',
                    preview: output.metadata?.originalPreview,
                    name: output.metadata?.fileName || 'Document'
                  }}
                  onSave={handleSaveRedline}
                  onExport={handleExportRedline}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">No redline document available</p>
                    <p className="text-sm text-gray-500">
                      {isLegalPipeline 
                        ? "Unable to generate redline from current pipeline output"
                        : "Run a legal document analysis pipeline to generate redline suggestions"
                      }
                    </p>
                    {isLegalPipeline && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded border text-xs text-left">
                        <p className="font-medium text-yellow-800 mb-1">Debug Info:</p>
                        <p className="text-yellow-700">Pipeline Type: {output?.summary?.pipelineType || 'Unknown'}</p>
                        <p className="text-yellow-700">Has Analysis: {!!output?.output?.analysis ? 'Yes' : 'No'}</p>
                        <p className="text-yellow-700">Analysis Items: {output?.output?.analysis?.length || 0}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="h-full m-0 overflow-auto">
              <LegalSummaryTab output={output} />
            </TabsContent>

            <TabsContent value="analysis" className="h-full m-0 overflow-auto">
              <LegalAnalysisTab output={output} />
            </TabsContent>

            <TabsContent value="grammar" className="h-full m-0 overflow-auto">
              <GrammarAnalysisTab result={output} />
            </TabsContent>

            <TabsContent value="raw" className="h-full m-0 overflow-auto">
              <RawDataTab output={output} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
