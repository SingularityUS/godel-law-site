
import React, { forwardRef, useRef } from "react";
import WorkbenchFlow from "./WorkbenchFlow";
import DocumentPreviewManager from "./DocumentPreviewManager";
import ModulePalette from "../ModulePalette";

/**
 * WorkbenchContainer Component
 * 
 * Purpose: Main container and entry point for the AI Workbench
 * This component provides the physical container and DOM reference needed
 * for React Flow coordinate calculations and drag-drop operations.
 * Previously AIWorkbench, now merged for simplified architecture.
 * 
 * Key Responsibilities:
 * - Provides styled container with proper dimensions and background
 * - Maintains DOM reference for coordinate transformations
 * - Manages workbench state and event coordination
 * - Provides imperative API for external document addition
 * 
 * Integration Points:
 * - Used by Index page as the main workspace component
 * - Receives uploaded files and editing state from parent
 * - Communicates module editing events via callbacks
 * - Exposes imperative API for document node creation
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

  const handlePaletteDragStart = (mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  };

  return (
    <>
      {/* Module Palette */}
      <div className="w-full border-b-2 border-black bg-white">
        <ModulePalette onDragStart={handlePaletteDragStart} />
      </div>

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
