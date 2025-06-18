
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { RedlineDocument } from "@/types/redlining";
import { RedlineDocumentViewer } from "@/components/redlining";
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

  const isLegalPipeline = output?.summary?.pipelineType === "Legal Document Analysis";

  // Generate redline document when output is available
  React.useEffect(() => {
    if (output && isLegalPipeline && !redlineDocument && !isGeneratingRedline) {
      setIsGeneratingRedline(true);
      try {
        console.log('Generating redline document from output:', output);
        const convertedDocument = transformGrammarData(output);
        if (convertedDocument) {
          setRedlineDocument(convertedDocument);
          console.log('Redline document generated successfully');
        } else {
          console.warn('Failed to generate redline document');
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

  const sidebarWidth = isOpen ? "w-[600px]" : "w-12";

  return (
    <div className={`${sidebarWidth} transition-all duration-300 ease-in-out flex flex-col border-l bg-white`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {isOpen && <span>Pipeline Results</span>}
        </Button>
        {isOpen && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Sidebar Content */}
      {isOpen && (
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 shrink-0">
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
                  <div className="h-full">
                    <RedlineDocumentViewer
                      document={redlineDocument}
                      originalDocument={{
                        type: output.metadata?.fileType || 'text/plain',
                        preview: output.metadata?.originalPreview,
                        name: output.metadata?.fileName || 'Document'
                      }}
                      onClose={() => {}} // Don't close the whole sidebar
                      onSave={handleSaveRedline}
                      onExport={handleExportRedline}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full p-6">
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">No redline document available</p>
                      <p className="text-sm text-gray-500">Run a legal document analysis pipeline to generate redline suggestions</p>
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
      )}
    </div>
  );
};

export default WorkspaceSidebar;
