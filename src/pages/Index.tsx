
import { useCallback, useState } from "react";
import AIWorkbench from "@/components/AIWorkbench";
import ModulePalette from "@/components/ModulePalette";
import PromptDrawer from "@/components/PromptDrawer";
import DocumentUpload from "@/components/DocumentUpload";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { BookOpen } from "lucide-react";

const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

export type UploadedFile = File & { preview?: string; extractedText?: string };

const Index = () => {
  // Manage which module node is being edited
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>();
  const [editingNode, setEditingNode] = useState<any>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [promptOverrides, setPromptOverrides] = useState<Record<string, string>>({});

  // Drag handler for module palette
  const handlePaletteDragStart = (mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  };

  // Handle file upload
  const handleFilesAccepted = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    // NOTE: Later, this should trigger a "document input" node creation in the AI graph!
    //       We'll wire this later after confirming upload integration with you.
  };

  // Handle when user selects a node for prompt editing
  const handleModuleEdit = useCallback((nodeId: string, node: any) => {
    setEditingNodeId(nodeId);
    setEditingNode(node);
  }, []);

  // Handle saving prompt override for a module node
  const handlePromptSave = () => {
    if (!editingNodeId) return;
    setEditingNode(undefined);
    setEditingNodeId(undefined);
  };

  // Pass state to the AIWorkbench, get selected node info for the prompt panel
  const drawerOpen = Boolean(editingNodeId && editingNode);
  let drawerModuleDef = undefined;
  let drawerPromptOverride = "";
  if (editingNode && editingNode.data) {
    drawerModuleDef = getModuleDef(editingNode.data.moduleType as ModuleKind);
    drawerPromptOverride = editingNode.data.promptOverride ?? "";
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-blue-100 via-slate-50 to-white">
      <header className="flex justify-between items-center py-8 px-8 border-b bg-white/80">
        <div className="flex items-center gap-3">
          <BookOpen size={40} className="text-primary" />
          <h1 className="text-3xl mb-0 font-bold tracking-tight">AI Production Line Builder</h1>
        </div>
        <div className="text-gray-600 font-semibold text-base">
          Visual workflow to compose document-processing AI agents
        </div>
      </header>

      {/* Document Upload Area */}
      <div className="px-8 pt-6 w-full max-w-3xl mx-auto">
        <DocumentUpload onFilesAccepted={handleFilesAccepted} />
        {uploadedFiles.length > 0 && (
          <div className="mt-5 bg-white border shadow rounded p-4">
            <div className="mb-2 font-semibold text-gray-800 flex items-center gap-2">
              <FilePreviewIcon file={uploadedFiles[0]} />
              {uploadedFiles[0].name}
              <span className="text-gray-500 text-xs ml-2">
                ({Math.round(uploadedFiles[0].size / 1024)} KB)
              </span>
            </div>
            <div className="text-xs text-gray-500">
              File ready. (Preview & extraction coming soon)
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-6 w-full" style={{maxWidth:1600, margin:"0 auto"}}>
        <ModulePalette onDragStart={handlePaletteDragStart} />
        <div className="h-6" />
        <AIWorkbench
          onModuleEdit={handleModuleEdit}
          editingPromptNodeId={editingNodeId}
        />
      </div>

      <PromptDrawer
        open={drawerOpen}
        onClose={() => {
          setEditingNode(undefined);
          setEditingNodeId(undefined);
        }}
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
};

// Helper file type icon
function FilePreviewIcon({ file }: { file: File }) {
  if (file.type === "application/pdf") {
    // PDF icon
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">PDF</span>;
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // DOCX icon
    return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">DOCX</span>;
  } else if (file.type === "text/plain") {
    // TXT icon
    return <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded">TXT</span>;
  }
  return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">FILE</span>;
}

export default Index;
