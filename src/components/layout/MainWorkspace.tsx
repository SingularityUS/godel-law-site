
/**
 * MainWorkspace Component
 * 
 * Purpose: Main content area containing module palette and workbench
 * This component organizes the primary workspace elements including the module
 * palette for dragging components and the main AI workbench interface.
 * 
 * Key Responsibilities:
 * - Renders module palette section with drag functionality
 * - Contains main AI workbench with workflow editing
 * - Manages workspace layout and responsive design
 * - Coordinates between palette and workbench interactions
 * 
 * Integration Points:
 * - Uses ModulePalette for component drag operations
 * - Integrates AIWorkbench for main workflow editing
 * - Handles module editing callbacks from workbench
 * - Manages uploaded files state for document nodes
 * 
 * Layout Structure:
 * 1. Module Palette - Top section for draggable components
 * 2. Main Workbench - Primary workflow editing area
 * 3. Responsive container with proper spacing and styling
 */

import React from "react";
import AIWorkbench from "@/components/AIWorkbench";
import ModulePalette from "@/components/ModulePalette";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface MainWorkspaceProps {
  onPaletteDragStart: (mod: any, event: React.DragEvent) => void;
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles: UploadedFile[];
  workbenchRef: React.RefObject<any>;
}

const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  onPaletteDragStart,
  onModuleEdit,
  editingPromptNodeId,
  uploadedFiles,
  workbenchRef
}) => {
  return (
    <div className="px-8 py-6 w-full" style={{maxWidth:1600, margin:"0 auto"}}>
      {/* Module Palette Section */}
      <div className="mb-4">
        <div className="text-sm font-bold text-black mb-2 uppercase">Module Palette</div>
        <ModulePalette onDragStart={onPaletteDragStart} />
      </div>
      
      {/* Main Workbench Section */}
      <div className="border-t-2 border-black pt-4">
        <AIWorkbench
          ref={workbenchRef}
          onModuleEdit={onModuleEdit}
          editingPromptNodeId={editingPromptNodeId}
          uploadedFiles={uploadedFiles}
        />
      </div>
    </div>
  );
};

export default MainWorkspace;
