
import React, { forwardRef, useRef, useImperativeHandle } from "react";
import DocumentPreviewManager from "./DocumentPreviewManager";
import ModulePaletteSection from "./sections/ModulePaletteSection";
import WorkspaceSection from "./sections/WorkspaceSection";
import { useWorkbenchDragDropHandlers } from "@/hooks/workbench/useWorkbenchDragDropHandlers";

/**
 * WorkbenchContainer Component
 * 
 * Purpose: Main container and entry point for the AI Workbench
 * This component provides the physical container and DOM reference needed
 * for React Flow coordinate calculations and drag-drop operations.
 * Previously AIWorkbench, now merged for simplified architecture.
 * 
 * Key Responsibilities:
 * - Orchestrates workbench sections (palette, workspace, preview)
 * - Maintains DOM reference for coordinate transformations
 * - Manages workbench state and event coordination
 * - Provides imperative API for external document addition
 * 
 * Integration Points:
 * - Used by Index page as the main workspace component
 * - Receives uploaded files and editing state from parent
 * - Communicates module editing events via callbacks
 * - Exposes imperative API for document node creation
 * 
 * Architecture:
 * - Composed of focused section components
 * - Uses specialized hooks for drag-drop handling
 * - Maintains clean separation of concerns
 */

interface WorkbenchContainerProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  onOpenSidebar: () => void;
}

const WorkbenchContainer = forwardRef<any, WorkbenchContainerProps>(function WorkbenchContainer(
  props,
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const { handlePaletteDragStart } = useWorkbenchDragDropHandlers();

  // Expose methods through the ref
  useImperativeHandle(ref, () => ({
    addDocumentNode: (file: any) => {
      if (workspaceRef.current && typeof workspaceRef.current.addDocumentNode === "function") {
        console.log('🔗 [WORKBENCH-CONTAINER] Forwarding addDocumentNode call');
        return workspaceRef.current.addDocumentNode(file);
      } else {
        console.warn('⚠️ [WORKBENCH-CONTAINER] WorkspaceSection ref not available');
      }
    },
    addDocumentNodes: (files: any[]) => {
      if (workspaceRef.current && typeof workspaceRef.current.addDocumentNodes === "function") {
        console.log('🔗 [WORKBENCH-CONTAINER] Forwarding addDocumentNodes call for', files.length, 'files');
        return workspaceRef.current.addDocumentNodes(files);
      } else {
        console.warn('⚠️ [WORKBENCH-CONTAINER] WorkspaceSection ref not available');
      }
    }
  }), []);

  return (
    <>
      {/* Module Palette Section */}
      <ModulePaletteSection onDragStart={handlePaletteDragStart} />

      {/* Main Workspace Section */}
      <WorkspaceSection
        reactFlowWrapper={reactFlowWrapper}
        forwardedRef={workspaceRef}
        onOpenSidebar={props.onOpenSidebar}
        {...props}
      />

      {/* Document Preview Manager */}
      <DocumentPreviewManager />
    </>
  );
});

export default WorkbenchContainer;
