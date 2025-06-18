
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Edit3, BarChart3 } from "lucide-react";
import { RedlineDocument } from "@/types/redlining";
import RedlineTabContent from "./RedlineTabContent";
import DocumentPreviewTab from "./DocumentPreviewTab";
import AnalysisContent from "../output/AnalysisContent";

interface SidebarTabsContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProcessing?: boolean;
  processingDocument?: any;
  isGeneratingRedline: boolean;
  redlineDocument: RedlineDocument | null;
  isLegalPipeline: boolean;
  output: any;
  previewDocument: { name: string; type: string; preview?: string } | null;
  onSaveRedline: (document: RedlineDocument) => void;
  onExportRedline: (document: RedlineDocument, format: string) => void;
}

const SidebarTabsContent: React.FC<SidebarTabsContentProps> = ({
  activeTab,
  setActiveTab,
  isProcessing,
  processingDocument,
  isGeneratingRedline,
  redlineDocument,
  isLegalPipeline,
  output,
  previewDocument,
  onSaveRedline,
  onExportRedline
}) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
          <TabsTrigger value="document" className="flex items-center gap-1">
            <FileText size={14} />
            <span className="hidden sm:inline">Document</span>
          </TabsTrigger>
          <TabsTrigger value="redline" className="flex items-center gap-1">
            <Edit3 size={14} />
            <span className="hidden sm:inline">Redline</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <BarChart3 size={14} />
            <span className="hidden sm:inline">Analysis</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden min-h-0">
          <TabsContent value="document" className="h-full m-0 overflow-hidden">
            <DocumentPreviewTab document={previewDocument} />
          </TabsContent>

          <TabsContent value="redline" className="h-full m-0 overflow-hidden">
            <RedlineTabContent
              isProcessing={isProcessing}
              processingDocument={processingDocument}
              isGeneratingRedline={isGeneratingRedline}
              redlineDocument={redlineDocument}
              isLegalPipeline={isLegalPipeline}
              output={output}
              onSaveRedline={onSaveRedline}
              onExportRedline={onExportRedline}
            />
          </TabsContent>

          <TabsContent value="analysis" className="h-full m-0 overflow-hidden">
            <div className="h-full overflow-auto">
              <AnalysisContent analysisData={output?.output?.analysis || []} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SidebarTabsContent;
