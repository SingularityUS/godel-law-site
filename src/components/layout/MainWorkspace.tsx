
/**
 * MainWorkspace Component
 * 
 * Purpose: Main content area containing module palette, workbench, and results sidebar
 * This component organizes the primary workspace elements including the module
 * palette for dragging components, the main AI workbench interface, and the
 * integrated results sidebar for pipeline outputs and redline documents.
 * 
 * Key Responsibilities:
 * - Renders module palette section with drag functionality
 * - Contains main AI workbench with workflow editing
 * - Manages workspace sidebar for pipeline results and redlining
 * - Manages workspace layout and responsive design with resizable panels
 * - Coordinates between palette, workbench, and sidebar interactions
 * 
 * Integration Points:
 * - Uses ModulePalette for component drag operations
 * - Integrates AIWorkbench for main workflow editing
 * - Uses WorkspaceSidebar for pipeline results and redlining
 * - Handles module editing callbacks from workbench
 * - Manages uploaded files state for document nodes
 * - Manages sidebar state and pipeline output display
 * 
 * Layout Structure:
 * 1. Module Palette - Top section for draggable components
 * 2. Main Workbench - Primary workflow editing area
 * 3. Results Sidebar - Pipeline outputs and redline document viewer (resizable)
 * 4. Responsive container with proper spacing and styling
 */

import React, { useState } from "react";
import AIWorkbench from "@/components/AIWorkbench";
import ModulePalette from "@/components/ModulePalette";
import WorkspaceSidebar from "@/components/workbench/WorkspaceSidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface MainWorkspaceProps {
  onPaletteDragStart: (mod: any, event: React.DragEvent) => void;
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles: UploadedFile[];
  workbenchRef: React.RefObject<any>;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-open sidebar when output is available
  React.useEffect(() => {
    if (finalOutput) {
      setIsSidebarOpen(true);
    }
  }, [finalOutput]);

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    if (onCloseFinalOutput) {
      onCloseFinalOutput();
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!finalOutput || !isSidebarOpen) {
    // Render without sidebar when no output or sidebar is closed
    return (
      <div className="flex h-full w-full">
        <div className="flex-1 px-8 py-6" style={{ margin: "0 auto" }}>
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

        {/* Collapsed Sidebar */}
        {finalOutput && (
          <WorkspaceSidebar
            output={finalOutput}
            isOpen={false}
            onClose={handleCloseSidebar}
            onToggle={handleToggleSidebar}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Main Workspace Panel */}
        <ResizablePanel defaultSize={70} minSize={10} maxSize={90}>
          <div className="flex-1 px-8 py-6 h-full overflow-auto">
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
        </ResizablePanel>

        {/* Resizable Handle */}
        <ResizableHandle withHandle />

        {/* Sidebar Panel */}
        <ResizablePanel defaultSize={30} minSize={10} maxSize={90}>
          <WorkspaceSidebar
            output={finalOutput}
            isOpen={true}
            onClose={handleCloseSidebar}
            onToggle={handleToggleSidebar}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MainWorkspace;
