
import React, { forwardRef, useRef } from "react";
import WorkbenchFlow from "./WorkbenchFlow";
import DocumentPreviewManager from "./DocumentPreviewManager";

/**
 * WorkbenchContainer Component
 * 
 * Purpose: Main container wrapper for the AI Workbench
 * This component provides the physical container and DOM reference needed
 * for React Flow coordinate calculations and drag-drop operations.
 * 
 * Key Responsibilities:
 * - Provides styled container with proper dimensions and background
 * - Maintains DOM reference for coordinate transformations
 * - Passes through all props and refs to child components
 * 
 * Integration Points:
 * - Used by AIWorkbench as the main container
 * - Provides reactFlowWrapper ref to WorkbenchFlow
 * - Coordinates with DocumentPreviewManager for preview functionality
 */

interface WorkbenchContainerProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
}

const WorkbenchContainer = forwardRef<any, WorkbenchContainerProps>(function WorkbenchContainer(
  props,
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Main React Flow workspace container */}
      <div 
        ref={reactFlowWrapper} 
        className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <WorkbenchFlow
          {...props}
          ref={ref}
          reactFlowWrapper={reactFlowWrapper}
        />
      </div>

      {/* Document Preview Manager */}
      <DocumentPreviewManager />
    </>
  );
});

export default WorkbenchContainer;
