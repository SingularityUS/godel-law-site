
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AIWorkbench from "@/components/AIWorkbench";
import WorkspaceSidebar from "@/components/workbench/WorkspaceSidebar";
import { useOutputPanel } from "@/hooks/workbench/useOutputPanel";

interface MainWorkspaceProps {
  onPaletteDragStart?: (mod: any, event: React.DragEvent) => void;
  onModuleEdit?: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  workbenchRef?: React.RefObject<any>;
  finalOutput?: any;
  onCloseFinalOutput?: () => void;
  isExecuting?: boolean;
  onPipelineStart?: () => void;
  onPipelineComplete?: (output: any) => void;
}

const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  onPaletteDragStart,
  onModuleEdit,
  editingPromptNodeId,
  uploadedFiles,
  workbenchRef,
  finalOutput,
  onCloseFinalOutput,
  isExecuting,
  onPipelineStart,
  onPipelineComplete
}) => {
  const { 
    output, 
    isOutputOpen, 
    isPipelineExecuting,
    closeOutput, 
    toggleOutput, 
    openOutput,
    openForPipelineExecution,
    handlePipelineCompletion
  } = useOutputPanel();

  // Listen for pipeline start events to immediately open sidebar
  React.useEffect(() => {
    const handlePipelineStarted = (event: CustomEvent) => {
      console.log('MainWorkspace: Pipeline started event received', event.detail);
      openForPipelineExecution();
      
      // Register streaming callback early
      const registerStreamingCallback = () => {
        console.log('Registering streaming callback for early results');
        const streamingEvent = new CustomEvent('registerStreamingCallback', {
          detail: { 
            timestamp: new Date().toISOString(),
            source: 'pipeline-start'
          }
        });
        window.dispatchEvent(streamingEvent);
      };
      
      // Register callback with slight delay to ensure components are ready
      setTimeout(registerStreamingCallback, 100);
    };

    const handlePipelineCompleted = (event: CustomEvent) => {
      console.log('MainWorkspace: Pipeline completed event received', event.detail);
      if (event.detail.finalOutput) {
        handlePipelineCompletion(event.detail.finalOutput);
      }
    };

    // Add event listeners
    window.addEventListener('pipelineStarted', handlePipelineStarted as EventListener);
    window.addEventListener('pipelineCompleted', handlePipelineCompleted as EventListener);

    // Cleanup listeners
    return () => {
      window.removeEventListener('pipelineStarted', handlePipelineStarted as EventListener);
      window.removeEventListener('pipelineCompleted', handlePipelineCompleted as EventListener);
    };
  }, [openForPipelineExecution, handlePipelineCompletion]);

  // Handle pipeline start - open sidebar immediately (fallback)
  React.useEffect(() => {
    if (isExecuting && onPipelineStart) {
      openForPipelineExecution();
    }
  }, [isExecuting, onPipelineStart, openForPipelineExecution]);

  // Use finalOutput when available (fallback)
  React.useEffect(() => {
    if (finalOutput) {
      handlePipelineCompletion(finalOutput);
    }
  }, [finalOutput, handlePipelineCompletion]);

  const handleClose = () => {
    closeOutput();
    if (onCloseFinalOutput) {
      onCloseFinalOutput();
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={50} minSize={30}>
          <AIWorkbench 
            onModuleEdit={onModuleEdit || (() => {})}
            editingPromptNodeId={editingPromptNodeId}
            uploadedFiles={uploadedFiles}
            ref={workbenchRef}
          />
        </ResizablePanel>
        
        {isOutputOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <WorkspaceSidebar 
                output={output || {}} // Provide empty object during execution
                isOpen={isOutputOpen}
                onClose={handleClose}
                onToggle={toggleOutput}
                isPipelineExecuting={isPipelineExecuting}
                isExecuting={isExecuting}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default MainWorkspace;
