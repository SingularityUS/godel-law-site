
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AIWorkbench from "@/components/AIWorkbench";
import WorkspaceSidebar from "@/components/workbench/WorkspaceSidebar";
import { useOutputPanel } from "@/hooks/workbench/useOutputPanel";
import { useDocumentContext } from "@/hooks/workbench/useDocumentContext";

interface MainWorkspaceProps {
  onPaletteDragStart?: (mod: any, event: React.DragEvent) => void;
  onModuleEdit?: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  workbenchRef?: React.RefObject<any>;
  finalOutput?: any;
  onCloseFinalOutput?: () => void;
}

const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  onPaletteDragStart,
  onModuleEdit,
  editingPromptNodeId,
  uploadedFiles,
  workbenchRef,
  finalOutput,
  onCloseFinalOutput
}) => {
  const { 
    output, 
    isOutputOpen, 
    isProcessing, 
    processingDocument,
    closeOutput, 
    toggleOutput, 
    openOutput,
    startProcessing
  } = useOutputPanel();
  
  const { extractDocumentFromNodes } = useDocumentContext();

  // Use finalOutput when available
  React.useEffect(() => {
    if (finalOutput) {
      openOutput(finalOutput);
    }
  }, [finalOutput, openOutput]);

  // Listen for pipeline execution start to open sidebar immediately
  React.useEffect(() => {
    const handlePipelineStart = () => {
      if (workbenchRef.current?.getNodes) {
        const nodes = workbenchRef.current.getNodes();
        const document = extractDocumentFromNodes(nodes);
        if (document) {
          startProcessing(document);
        }
      }
    };

    window.addEventListener('pipelineExecutionStart', handlePipelineStart);
    
    return () => {
      window.removeEventListener('pipelineExecutionStart', handlePipelineStart);
    };
  }, [extractDocumentFromNodes, startProcessing]);

  const handleClose = () => {
    closeOutput();
    if (onCloseFinalOutput) {
      onCloseFinalOutput();
    }
  };

  const showSidebar = isOutputOpen || isProcessing;

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={50} minSize={30}>
          <AIWorkbench 
            onModuleEdit={onModuleEdit || (() => {})}
            editingPromptNodeId={editingPromptNodeId}
            uploadedFiles={uploadedFiles}
            ref={workbenchRef}
            onOpenSidebar={() => {
              if (workbenchRef.current?.getNodes) {
                const nodes = workbenchRef.current.getNodes();
                const document = extractDocumentFromNodes(nodes);
                if (document) {
                  startProcessing(document);
                }
              }
            }}
          />
        </ResizablePanel>
        
        {showSidebar && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <WorkspaceSidebar 
                output={output}
                isOpen={isOutputOpen}
                isProcessing={isProcessing}
                processingDocument={processingDocument}
                onClose={handleClose}
                onToggle={toggleOutput}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default MainWorkspace;
