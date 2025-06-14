
import { useCallback, useRef, useState } from "react";
import AIWorkbench from "@/components/AIWorkbench";
import ModulePalette from "@/components/ModulePalette";
import PromptDrawer from "@/components/PromptDrawer";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { BookOpen } from "lucide-react";

const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

const Index = () => {
  // Manage which module node is being edited
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>();
  const [editingNode, setEditingNode] = useState<any>();
  const [promptOverrides, setPromptOverrides] = useState<Record<string, string>>({});

  // Drag handler for module palette
  const handlePaletteDragStart = (mod: any, event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(mod));
  };

  // Handle when user selects a node for prompt editing
  const handleModuleEdit = useCallback((nodeId: string, node: any) => {
    setEditingNodeId(nodeId);
    setEditingNode(node);
  }, []);

  // Handle saving prompt override for a module node
  const handlePromptSave = () => {
    if (!editingNodeId) return;
    // state for prompt override could be managed here for persistence
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
          // In real app, would set prompt on the right module node
          if (editingNode && editingNode.data) {
            editingNode.data.promptOverride = newPrompt;
          }
        }}
        onSave={handlePromptSave}
      />
    </div>
  );
};

export default Index;
