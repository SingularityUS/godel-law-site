
/**
 * Index Page Component
 * 
 * Purpose: Main application page that orchestrates the AI Workbench interface
 * This is the primary entry point for authenticated users and serves as the central
 * hub that coordinates all major application components and user interactions.
 * 
 * Architecture Overview:
 * - Layout: Header with navigation and user controls + Main workspace area
 * - State Management: Manages file uploads, library state, and module editing
 * - Component Coordination: Orchestrates communication between all major components
 * 
 * Key Responsibilities:
 * 1. User Authentication: Displays user info and provides logout functionality
 * 2. File Management: Handles document uploads and library interactions
 * 3. Workspace Control: Manages the AI workbench and module editing states
 * 4. Navigation: Provides access to major application features
 * 
 * Component Relationships:
 * - AIWorkbench: Main workspace for creating AI workflows
 * - ModulePalette: Drag source for AI processing modules
 * - DocumentUpload: File upload interface for documents
 * - DocumentLibrary: Modal for browsing uploaded documents
 * - ModuleSettingsDrawer: Side panel for editing module configurations
 * 
 * Data Flow:
 * 1. User uploads files → DocumentUpload → triggers library refresh
 * 2. User opens library → DocumentLibrary → selects document → adds to workbench
 * 3. User drags modules → ModulePalette → adds to workbench
 * 4. User edits modules → AIWorkbench → opens ModuleSettingsDrawer
 * 5. All changes flow back through callback props to maintain state consistency
 */

import { useCallback, useState } from "react";
import AIWorkbench from "@/components/AIWorkbench";
import ModulePalette from "@/components/ModulePalette";
import ModuleSettingsDrawer from "@/components/ModuleSettingsDrawer";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentLibrary from "@/components/DocumentLibrary";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { BookOpen, FolderOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useDocuments } from "@/hooks/useDocuments";
import React from "react";

/**
 * Helper function to get module definition by type
 * Used for passing module metadata to the settings drawer
 */
const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

// Type definition for uploaded files with additional metadata
export type UploadedFile = File & { preview?: string; extractedText?: string };

const Index = () => {
  // Module editing state - tracks which module is currently being edited
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>();
  const [editingNode, setEditingNode] = useState<any>();
  
  // File management state - tracks uploaded files for workspace integration
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // UI state - controls library modal visibility
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // External hooks for authentication and document management
  const { user, signOut } = useAuth();
  const { refetch } = useDocuments();

  /**
   * Module Palette Drag Handler
   * 
   * Initiates drag operation when user drags modules from palette
   * Sets up data transfer for the workbench to receive the module
   * 
   * @param mod - Module definition being dragged
   * @param event - Drag event for data transfer setup
   */
  const handlePaletteDragStart = (mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  };

  /**
   * File Upload Handler
   * 
   * Processes newly uploaded files and adds them to local state
   * Maintains a collection of all uploaded files for potential workspace use
   * 
   * @param files - Array of uploaded files with metadata
   */
  const handleFilesAccepted = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  /**
   * Upload Completion Handler
   * 
   * Triggers document library refresh after successful uploads
   * Ensures library shows the most current document collection
   */
  const handleUploadComplete = () => {
    refetch(); // Refresh the document library
  };

  /**
   * Module Edit Handler
   * 
   * Opens the module settings drawer for the specified node
   * Triggered when user clicks edit button on helper nodes in the workbench
   * 
   * @param nodeId - Unique identifier of the node being edited
   * @param node - Full node object with current configuration
   */
  const handleModuleEdit = useCallback((nodeId: string, node: any) => {
    setEditingNodeId(nodeId);
    setEditingNode(node);
  }, []);

  /**
   * Prompt Save Handler
   * 
   * Closes the module settings drawer after saving changes
   * Completes the module editing workflow
   */
  const handlePromptSave = () => {
    if (!editingNodeId) return;
    setEditingNode(undefined);
    setEditingNodeId(undefined);
  };

  /**
   * Document Selection Handler
   * 
   * Adds selected document from library to the workbench
   * Uses imperative API to directly create document nodes
   * 
   * @param file - Selected file from the document library
   */
  const handleDocumentSelect = (file: UploadedFile) => {
    if (workbenchRef.current && typeof workbenchRef.current.addDocumentNode === "function") {
      workbenchRef.current.addDocumentNode(file);
    }
  };

  // Ref for imperative access to workbench methods
  const workbenchRef = React.useRef<any>(null);

  // Compute drawer state and module definition for settings drawer
  const drawerOpen = Boolean(editingNodeId && editingNode);
  let drawerModuleDef = undefined;
  let drawerPromptOverride = "";
  if (editingNode && editingNode.data) {
    drawerModuleDef = getModuleDef(editingNode.data.moduleType as ModuleKind);
    drawerPromptOverride = editingNode.data.promptOverride ?? "";
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Courier New, monospace' }}>
      {/* Application Header */}
      <header className="flex justify-between items-center py-4 px-8 border-b-2 border-black bg-white">
        {/* Application Branding */}
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-black" />
          <h1 className="text-2xl font-bold tracking-tight text-black">AI PRODUCTION LINE BUILDER</h1>
        </div>
        
        {/* Document Management Controls */}
        <div className="flex items-center gap-4">
          <DocumentUpload 
            onFilesAccepted={handleFilesAccepted} 
            onUploadComplete={handleUploadComplete}
          />
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 border-2 border-black bg-white hover:bg-gray-100 px-3 py-2 text-sm font-bold"
          >
            <FolderOpen size={16} />
            LIBRARY
          </button>
        </div>

        {/* User Authentication Section */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-black font-bold">
            {user?.email}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => signOut()}
            className="border-2 border-black font-bold"
          >
            LOG OUT
          </Button>
        </div>
      </header>

      {/* Main Application Content */}
      <div className="px-8 py-6 w-full" style={{maxWidth:1600, margin:"0 auto"}}>
        {/* Module Palette Section */}
        <div className="mb-4">
          <div className="text-sm font-bold text-black mb-2 uppercase">Module Palette</div>
          <ModulePalette onDragStart={handlePaletteDragStart} />
        </div>
        
        {/* Main Workbench Section */}
        <div className="border-t-2 border-black pt-4">
          <AIWorkbench
            ref={workbenchRef}
            onModuleEdit={handleModuleEdit}
            editingPromptNodeId={editingNodeId}
            uploadedFiles={uploadedFiles}
          />
        </div>
      </div>

      {/* Modal Components */}
      <DocumentLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onDocumentSelect={handleDocumentSelect}
      />

      <ModuleSettingsDrawer
        open={drawerOpen}
        onClose={() => {
          setEditingNode(undefined);
          setEditingNodeId(undefined);
        }}
        nodeId={editingNodeId || ""}
        moduleLabel={drawerModuleDef?.label ?? ""}
        moduleIcon={drawerModuleDef ? <drawerModuleDef.icon size={24} /> : null}
        systemPrompt={drawerModuleDef?.defaultPrompt ?? ""}
        promptOverride={drawerPromptOverride}
        onPromptChange={(newPrompt) => {
          if (editingNode && editingNode.data) {
            editingNode.data.promptOverride = newPrompt;
          }
        }}
        onSave={handlePromptSave}
      />
    </div>
  );
}

export default Index;
