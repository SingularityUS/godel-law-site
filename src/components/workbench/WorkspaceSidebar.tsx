
import React from "react";
import { useWorkspaceSidebarState } from "@/hooks/workbench/useWorkspaceSidebarState";
import { useStreamingRedlineGeneration } from "@/hooks/workbench/useStreamingRedlineGeneration";
import WorkspaceSidebarHeader from "./sidebar/WorkspaceSidebarHeader";
import SidebarTabsContent from "./sidebar/SidebarTabsContent";

/**
 * WorkspaceSidebar Component
 * 
 * Purpose: Integrated sidebar for pipeline results and redlining with streaming support
 * Now supports real-time redline updates as processing batches complete
 * 
 * Key Responsibilities:
 * - Orchestrates sidebar layout and behavior
 * - Integrates with pipeline output data
 * - Provides streaming redline document generation and editing
 * 
 * Architecture:
 * - Uses streaming-capable redline generation hook
 * - Delegates UI rendering to specialized components
 * - Maintains clean separation of concerns
 */

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
  // Use focused state management hook
  const {
    activeTab,
    setActiveTab,
    isLegalPipeline
  } = useWorkspaceSidebarState(output);

  // Use streaming redline generation hook for real-time updates
  const {
    redlineDocument,
    isGeneratingRedline,
    streamingProgress,
    handleSaveRedline,
    handleExportRedline
  } = useStreamingRedlineGeneration({
    output,
    isLegalPipeline
  });

  if (!output) return null;

  return (
    <div className="flex flex-col border-l bg-white h-full">
      <WorkspaceSidebarHeader 
        isOpen={isOpen}
        onClose={onClose}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="flex-1 overflow-hidden">
          <SidebarTabsContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isGeneratingRedline={isGeneratingRedline}
            redlineDocument={redlineDocument}
            isLegalPipeline={isLegalPipeline}
            output={output}
            streamingProgress={streamingProgress}
            onSaveRedline={handleSaveRedline}
            onExportRedline={handleExportRedline}
          />
        </div>
      )}
    </div>
  );
};

export default WorkspaceSidebar;
