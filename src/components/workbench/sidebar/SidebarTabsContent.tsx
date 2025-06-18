
/**
 * SidebarTabsContent Component
 * 
 * Purpose: Main tabs content for the workspace sidebar with streaming support
 * Extracted from WorkspaceSidebar for better organization
 */

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RedlineDocument } from "@/types/redlining";
import StreamingRedlineTabContent from "./StreamingRedlineTabContent";
import LegalSummaryTab from "../output/LegalSummaryTab";
import LegalAnalysisTab from "../output/LegalAnalysisTab";
import GrammarAnalysisTab from "../output/GrammarAnalysisTab";
import RawDataTab from "../output/RawDataTab";

interface SidebarTabsContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isGeneratingRedline: boolean;
  redlineDocument: RedlineDocument | null;
  isLegalPipeline: boolean;
  output: any;
  streamingProgress?: {
    completed: number;
    total: number;
    hasPartialResults: boolean;
  };
  onSaveRedline: (document: RedlineDocument) => void;
  onExportRedline: (document: RedlineDocument, format: string) => void;
}

const SidebarTabsContent: React.FC<SidebarTabsContentProps> = ({
  activeTab,
  setActiveTab,
  isGeneratingRedline,
  redlineDocument,
  isLegalPipeline,
  output,
  streamingProgress,
  onSaveRedline,
  onExportRedline
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-5 shrink-0 m-2">
        <TabsTrigger value="redline">
          Redline
          {streamingProgress && streamingProgress.total > 0 && (
            <span className="ml-1 text-xs text-blue-600">
              ({streamingProgress.completed}/{streamingProgress.total})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="grammar">Grammar</TabsTrigger>
        <TabsTrigger value="raw">Raw Data</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="redline" className="h-full m-0">
          <StreamingRedlineTabContent
            isGeneratingRedline={isGeneratingRedline}
            redlineDocument={redlineDocument}
            isLegalPipeline={isLegalPipeline}
            output={output}
            streamingProgress={streamingProgress}
            onSaveRedline={onSaveRedline}
            onExportRedline={onExportRedline}
          />
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
  );
};

export default SidebarTabsContent;
