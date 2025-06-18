
import React from "react";
import { useWorkspaceSidebarState } from "@/hooks/workbench/useWorkspaceSidebarState";
import { useStreamingRedlineGeneration } from "@/hooks/workbench/useStreamingRedlineGeneration";
import WorkspaceSidebarHeader from "./sidebar/WorkspaceSidebarHeader";
import SidebarTabsContent from "./sidebar/SidebarTabsContent";

/**
 * WorkspaceSidebar Component
 * 
 * Purpose: Integrated sidebar for pipeline results and redlining with streaming support
 * Enhanced to handle immediate display during pipeline execution
 */

interface WorkspaceSidebarProps {
  output: any;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  isPipelineExecuting?: boolean;
  isExecuting?: boolean;
}

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  output,
  isOpen,
  onClose,
  onToggle,
  isPipelineExecuting = false,
  isExecuting = false
}) => {
  // Use focused state management hook
  const {
    activeTab,
    setActiveTab,
    isLegalPipeline
  } = useWorkspaceSidebarState(output);

  // Batch completion handler for streaming results
  const handleBatchComplete = React.useCallback((batchResult: any, batchIndex: number, totalBatches: number) => {
    console.log(`WorkspaceSidebar: Batch ${batchIndex + 1}/${totalBatches} completed for streaming display`);
  }, []);

  // Use streaming redline generation hook for real-time updates
  const {
    redlineDocument,
    isGeneratingRedline,
    streamingProgress,
    handleSaveRedline,
    handleExportRedline
  } = useStreamingRedlineGeneration({
    output,
    isLegalPipeline: isLegalPipeline || isPipelineExecuting,
    onBatchComplete: handleBatchComplete
  });

  // Register streaming callback early when pipeline starts executing
  React.useEffect(() => {
    if (isPipelineExecuting || isExecuting) {
      console.log('WorkspaceSidebar: Pipeline execution started - ensuring streaming callback registration');
    }
  }, [isPipelineExecuting, isExecuting]);

  return (
    <div className="flex flex-col border-l bg-white h-full">
      <WorkspaceSidebarHeader 
        isOpen={isOpen}
        onClose={onClose}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="flex-1 overflow-hidden">
          {isPipelineExecuting && !output?.output ? (
            // Show executing state
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Pipeline Executing...</p>
                <p className="text-sm text-gray-500 mt-2">Results will appear as batches complete</p>
                <div className="mt-4 p-3 bg-blue-50 rounded border text-xs">
                  <p className="text-blue-700">
                    🔄 Streaming callback registered - waiting for results...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <SidebarTabsContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isGeneratingRedline={isGeneratingRedline}
              redlineDocument={redlineDocument}
              isLegalPipeline={isLegalPipeline || isPipelineExecuting}
              output={output}
              streamingProgress={streamingProgress}
              onSaveRedline={handleSaveRedline}
              onExportRedline={handleExportRedline}
              isPipelineExecuting={isPipelineExecuting}
              isExecuting={isExecuting}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSidebar;
