
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

  // Handle pipeline start - open sidebar immediately
  React.useEffect(() => {
    if (isExecuting && onPipelineStart) {
      openForPipelineExecution();
    }
  }, [isExecuting, onPipelineStart, openForPipelineExecution]);

  // Use finalOutput when available
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
