
/**
 * FinalOutputPanel Component
 * 
 * Purpose: Legacy component - functionality moved to WorkspaceSidebar
 * This component is kept for backward compatibility but functionality
 * has been moved to the integrated WorkspaceSidebar component.
 * 
 * Note: This component should no longer be used in new implementations.
 * Use WorkspaceSidebar instead for integrated pipeline results and redlining.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOutputPanel } from "@/hooks/workbench/useOutputPanel";
import OutputPanelHeader from "./output/OutputPanelHeader";
import LegalSummaryTab from "./output/LegalSummaryTab";
import LegalAnalysisTab from "./output/LegalAnalysisTab";
import GrammarAnalysisTab from "./output/GrammarAnalysisTab";
import RawDataTab from "./output/RawDataTab";

interface FinalOutputPanelProps {
  output: any;
  onClose: () => void;
}

const FinalOutputPanel: React.FC<FinalOutputPanelProps> = ({
  output,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { handleCopy, handleDownload } = useOutputPanel();

  if (!output) return null;

  console.log('FinalOutputPanel received output:', output);

  const isLegalPipeline = output.summary?.pipelineType === "Legal Document Analysis";

  const renderContent = () => {
    if (isLegalPipeline) {
      // Extract the grammar analysis data for the grammar tab
      const grammarAnalysisData = output.finalOutput || output;
      console.log('Grammar analysis data being passed:', grammarAnalysisData);

      return (
        <Tabs defaultValue="summary" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="grammar">Grammar</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="h-full">
            <LegalSummaryTab output={output} />
          </TabsContent>

          <TabsContent value="analysis" className="h-full">
            <LegalAnalysisTab output={output} />
          </TabsContent>

          <TabsContent value="grammar" className="h-full">
            <GrammarAnalysisTab result={grammarAnalysisData} />
          </TabsContent>

          <TabsContent value="raw" className="h-full">
            <RawDataTab output={output} />
          </TabsContent>
        </Tabs>
      );
    }

    return <RawDataTab output={output} />;
  };

  return (
    <div className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-[600px] max-h-[600px]'} z-50`}>
      <Card className="h-full flex flex-col border-2 border-black bg-white shadow-lg">
        <CardHeader className="flex-shrink-0 border-b-2 border-black pb-3">
          <OutputPanelHeader
            isLegalPipeline={isLegalPipeline}
            isExpanded={isExpanded}
            onToggleExpanded={() => setIsExpanded(!isExpanded)}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onClose={onClose}
          />
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-hidden">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinalOutputPanel;
