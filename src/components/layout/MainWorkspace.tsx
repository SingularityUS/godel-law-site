
import React from "react";
import AIWorkbench from "@/components/AIWorkbench";

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
  onModuleEdit,
  editingPromptNodeId,
  uploadedFiles,
  workbenchRef
}) => {
  return (
    <div className="flex-1 overflow-hidden">
      <AIWorkbench 
        onModuleEdit={onModuleEdit || (() => {})}
        editingPromptNodeId={editingPromptNodeId}
        uploadedFiles={uploadedFiles}
        onOpenSidebar={() => {}} // No sidebar needed for this tab
        ref={workbenchRef}
      />
    </div>
  );
};

export default MainWorkspace;
