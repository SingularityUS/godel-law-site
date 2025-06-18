
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AIWorkbench from "@/components/AIWorkbench";
import WorkspaceSidebar from "@/components/workbench/WorkspaceSidebar";
import { useOutputPanel } from "@/hooks/workbench/useOutputPanel";
import { useDocumentContext } from "@/hooks/workbench/useDocumentContext";

interface DocumentAnalyzerTabProps {
  onModuleEdit?: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  workbenchRef?: React.RefObject<any>;
  finalOutput?: any;
  onCloseFinalOutput?: () => void;
}

const DocumentAnalyzerTab: React.FC<DocumentAnalyzerTabProps> = ({
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

  // Direct callback to open sidebar - replaces event system
  const handleOpenSidebar = React.useCallback(() => {
    console.log('🎯 DocumentAnalyzerTab: handleOpenSidebar called');
    console.log('🎯 DocumentAnalyzerTab: workbenchRef.current:', workbenchRef?.current);
    console.log('🎯 DocumentAnalyzerTab: workbenchRef.current?.getNodes:', workbenchRef?.current?.getNodes);
    
    if (workbenchRef?.current?.getNodes) {
      const nodes = workbenchRef.current.getNodes();
      console.log('🎯 DocumentAnalyzerTab: Retrieved nodes:', nodes?.length, 'nodes');
      
      const document = extractDocumentFromNodes(nodes);
      console.log('🎯 DocumentAnalyzerTab: Extracted document:', document);
      
      if (document) {
        console.log('🎯 DocumentAnalyzerTab: Calling startProcessing with document:', document.name);
        startProcessing(document);
      } else {
        console.log('❌ DocumentAnalyzerTab: No document found to start processing');
      }
    } else {
      console.log('❌ DocumentAnalyzerTab: workbenchRef or getNodes not available');
    }
  }, [extractDocumentFromNodes, startProcessing, workbenchRef]);

  const handleClose = () => {
    closeOutput();
    if (onCloseFinalOutput) {
      onCloseFinalOutput();
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={70} minSize={40}>
          <AIWorkbench 
            onModuleEdit={onModuleEdit || (() => {})}
            editingPromptNodeId={editingPromptNodeId}
            uploadedFiles={uploadedFiles}
            onOpenSidebar={handleOpenSidebar}
            ref={workbenchRef}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        <ResizablePanel defaultSize={30} minSize={25}>
          <WorkspaceSidebar 
            output={output}
            isOpen={isOutputOpen}
            isProcessing={isProcessing}
            processingDocument={processingDocument}
            onClose={handleClose}
            onToggle={toggleOutput}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DocumentAnalyzerTab;
