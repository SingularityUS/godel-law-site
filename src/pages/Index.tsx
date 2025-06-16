
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

const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

export type UploadedFile = File & { preview?: string; extractedText?: string };

const Index = () => {
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>();
  const [editingNode, setEditingNode] = useState<any>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { refetch } = useDocuments();

  const handlePaletteDragStart = (mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  };

  const handleFilesAccepted = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleUploadComplete = () => {
    refetch(); // Refresh the document library
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
      <header className="flex justify-between items-center py-4 px-8 border-b-2 border-black bg-white">
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-black" />
          <h1 className="text-2xl font-bold tracking-tight text-black">AI PRODUCTION LINE BUILDER</h1>
        </div>
        
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

      <div className="px-8 py-6 w-full" style={{maxWidth:1600, margin:"0 auto"}}>
        <div className="mb-4">
          <div className="text-sm font-bold text-black mb-2 uppercase">Module Palette</div>
          <ModulePalette onDragStart={handlePaletteDragStart} />
        </div>
        
        <div className="border-t-2 border-black pt-4">
          <AIWorkbench
            ref={workbenchRef}
            onModuleEdit={handleModuleEdit}
            editingPromptNodeId={editingNodeId}
            uploadedFiles={uploadedFiles}
          />
        </div>
      </div>

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
