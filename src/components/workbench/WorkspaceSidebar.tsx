
import React from "react";
import { useWorkspaceSidebarState } from "@/hooks/workbench/useWorkspaceSidebarState";
import { useRedlineGeneration } from "@/hooks/workbench/useRedlineGeneration";
import WorkspaceSidebarHeader from "./sidebar/WorkspaceSidebarHeader";
import SidebarTabsContent from "./sidebar/SidebarTabsContent";

/**
 * WorkspaceSidebar Component
 * 
 * Purpose: Integrated sidebar for pipeline results and redlining
 * Refactored to use smaller, focused components and hooks
 * 
 * Key Responsibilities:
 * - Orchestrates sidebar layout and behavior
 * - Integrates with pipeline output data
 * - Provides redline document generation and editing
 * 
 * Architecture:
 * - Uses focused state management and generation hooks
 * - Delegates UI rendering to specialized components
 * - Maintains clean separation of concerns
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

  // Use redline generation hook
  const {
    redlineDocument,
    isGeneratingRedline,
    handleSaveRedline,
    handleExportRedline
  } = useRedlineGeneration({
    output,
    isLegalPipeline
  });

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
            isGeneratingRedline={isGeneratingRedline}
            redlineDocument={redlineDocument}
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
