
import { useCallback, useState } from "react";
import ModuleSettingsDrawer from "@/components/ModuleSettingsDrawer";
import DocumentLibrary from "@/components/DocumentLibrary";
import AppHeader from "@/components/layout/AppHeader";
import MainWorkspace from "@/components/layout/MainWorkspace";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { useDocuments } from "@/hooks/useDocuments";
import React from "react";

const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

export type UploadedFile = File & { preview?: string; extractedText?: string };

const Index = () => {
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>();
  const [editingNode, setEditingNode] = useState<any>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { refetch } = useDocuments();

  const handlePaletteDragStart = (mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  };

  const handleFilesAccepted = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleUploadComplete = () => {
    refetch();
  };

  const handleDocumentAdded = () => {
    // Automatically open the library when a document is added
    setIsLibraryOpen(true);
  };

  const handleModuleEdit = useCallback((nodeId: string, node: any) => {
    setEditingNodeId(nodeId);
    setEditingNode(node);
  }, []);

  const handlePromptSave = () => {
    if (!editingNodeId) return;
    setEditingNode(undefined);
    setEditingNodeId(undefined);
  };

  const handleDocumentSelect = (file: UploadedFile) => {
    if (workbenchRef.current && typeof workbenchRef.current.addDocumentNode === "function") {
      workbenchRef.current.addDocumentNode(file);
    }
  };

  const workbenchRef = React.useRef<any>(null);

  const drawerOpen = Boolean(editingNodeId && editingNode);
  let drawerModuleDef = undefined;
  let drawerPromptOverride = "";
  if (editingNode && editingNode.data) {
    drawerModuleDef = getModuleDef(editingNode.data.moduleType as ModuleKind);
    drawerPromptOverride = editingNode.data.promptOverride ?? "";
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Courier New, monospace' }}>
      <AppHeader 
        onFilesAccepted={handleFilesAccepted}
        onUploadComplete={handleUploadComplete}
        onLibraryOpen={() => setIsLibraryOpen(true)}
        onDocumentAdded={handleDocumentAdded}
      />

      <MainWorkspace 
        onPaletteDragStart={handlePaletteDragStart}
        onModuleEdit={handleModuleEdit}
        editingPromptNodeId={editingNodeId}
        uploadedFiles={uploadedFiles}
        workbenchRef={workbenchRef}
      />

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
