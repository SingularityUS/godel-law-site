
/**
 * WorkspaceSection Component
 * 
 * Purpose: Dedicated section container for the main React Flow workspace
 * Provides the workspace area with proper styling and dimensions
 * 
 * Responsibilities:
 * - Renders the main workspace container
 * - Provides DOM reference for React Flow coordinate calculations
 * - Maintains workspace styling and dimensions
 */

import React from "react";
import WorkbenchFlow from "../WorkbenchFlow";

interface WorkspaceSectionProps {
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  forwardedRef?: React.Ref<any>;
  onOpenSidebar: () => void;
}

const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  reactFlowWrapper,
  onModuleEdit,
  editingPromptNodeId,
  uploadedFiles,
  forwardedRef,
  onOpenSidebar
}) => {
  return (
    <div 
      ref={reactFlowWrapper} 
      className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50"
    >
      <WorkbenchFlow
        onModuleEdit={onModuleEdit}
        editingPromptNodeId={editingPromptNodeId}
        uploadedFiles={uploadedFiles}
        ref={forwardedRef}
        reactFlowWrapper={reactFlowWrapper}
        onOpenSidebar={onOpenSidebar}
      />
    </div>
  );
};

export default WorkspaceSection;
