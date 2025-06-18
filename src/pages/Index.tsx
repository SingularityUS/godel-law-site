
import { useCallback, useState, useRef } from "react";
import ModuleSettingsDrawer from "@/components/ModuleSettingsDrawer";
import DocumentLibrary from "@/components/DocumentLibrary";
import AppHeader from "@/components/layout/AppHeader";
import DocumentAnalyzerTab from "@/components/tabs/DocumentAnalyzerTab";
import DocumentBuilderTab from "@/components/tabs/DocumentBuilderTab";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { useDocuments } from "@/hooks/useDocuments";
import React from "react";

const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

export type UploadedFile = File & { preview?: string; extractedText?: string };

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState<string>('document-analyzer');
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>();
  const [editingNode, setEditingNode] = useState<any>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const { refetch } = useDocuments();

  const workbenchRef = useRef<any>(null);

  // Listen for pipeline completion events from the workbench
  React.useEffect(() => {
    const handlePipelineOutput = (event: CustomEvent) => {
      console.log('Pipeline output received in Index:', event.detail);
      setFinalOutput(event.detail);
    };

    window.addEventListener('pipelineCompleted', handlePipelineOutput as EventListener);
    
    return () => {
      window.removeEventListener('pipelineCompleted', handlePipelineOutput as EventListener);
    };
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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

  const handleCloseFinalOutput = () => {
    setFinalOutput(null);
  };

  const drawerOpen = Boolean(editingNodeId && editingNode);
  let drawerModuleDef = undefined;
  let drawerPromptOverride = "";
  if (editingNode && editingNode.data) {
    drawerModuleDef = getModuleDef(editingNode.data.moduleType as ModuleKind);
    drawerPromptOverride = editingNode.data.promptOverride ?? "";
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'document-analyzer':
        return (
          <DocumentAnalyzerTab
            onModuleEdit={handleModuleEdit}
            editingPromptNodeId={editingNodeId}
            uploadedFiles={uploadedFiles}
            workbenchRef={workbenchRef}
            finalOutput={finalOutput}
            onCloseFinalOutput={handleCloseFinalOutput}
          />
        );
      case 'document-builder':
        return <DocumentBuilderTab />;
      default:
        return (
          <DocumentAnalyzerTab
            onModuleEdit={handleModuleEdit}
            editingPromptNodeId={editingNodeId}
            uploadedFiles={uploadedFiles}
            workbenchRef={workbenchRef}
            finalOutput={finalOutput}
            onCloseFinalOutput={handleCloseFinalOutput}
          />
        );
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Courier New, monospace' }}>
      <AppHeader 
        onFilesAccepted={handleFilesAccepted}
        onUploadComplete={handleUploadComplete}
        onLibraryOpen={() => setIsLibraryOpen(true)}
        onDocumentAdded={handleDocumentAdded}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
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
};

const Index = () => {
  return (
    <ErrorBoundary>
      <IndexContent />
    </ErrorBoundary>
  );
}

export default Index;
