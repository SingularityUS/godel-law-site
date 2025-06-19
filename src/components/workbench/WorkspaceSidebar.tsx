
import React from "react";
import { useWorkspaceSidebarState } from "@/hooks/workbench/useWorkspaceSidebarState";
import { RedlineDocument } from "@/types/redlining";
import WorkspaceSidebarHeader from "./sidebar/WorkspaceSidebarHeader";
import SidebarTabsContent from "./sidebar/SidebarTabsContent";
import { toast } from "@/hooks/use-toast";

/**
 * WorkspaceSidebar Component
 * 
 * Purpose: Simplified sidebar using the new redline processing system
 */

interface WorkspaceSidebarProps {
  output: any;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  isProcessing?: boolean;
  processingDocument?: any;
}

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  output,
  isOpen,
  onClose,
  onToggle,
  isProcessing,
  processingDocument
}) => {
  // Use focused state management hook
  const {
    activeTab,
    setActiveTab,
    previewDocument,
    isLegalPipeline
  } = useWorkspaceSidebarState(output);

  // Simple save/export handlers
  const handleSaveRedline = (document: RedlineDocument) => {
    console.log('Saving redline document:', document);
    toast({
      title: "Success",
      description: "Redline document saved successfully"
    });
  };

  const handleExportRedline = (document: RedlineDocument, format: string) => {
    console.log(`Exporting redline document in ${format} format:`, document);
    toast({
      title: "Success",
      description: `Redline document exported in ${format} format`
    });
  };

  return (
    <div className="flex flex-col border-l bg-white h-full max-h-full overflow-hidden">
      <WorkspaceSidebarHeader 
        isOpen={isOpen}
        onClose={onClose}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="flex-1 overflow-hidden min-h-0">
          <SidebarTabsContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isProcessing={isProcessing}
            processingDocument={processingDocument}
            isGeneratingRedline={false} // Handled by RedlineTabContent now
            redlineDocument={null} // Handled by RedlineTabContent now
            isLegalPipeline={isLegalPipeline}
            output={output}
            previewDocument={previewDocument}
            onSaveRedline={handleSaveRedline}
            onExportRedline={handleExportRedline}
          />
        </div>
      )}

      {!isOpen && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <p className="text-sm mb-2">Pipeline Results</p>
            <p className="text-xs">Click to expand sidebar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSidebar;
