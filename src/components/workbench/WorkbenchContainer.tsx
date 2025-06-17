
import React, { forwardRef, useState, useEffect } from "react";
import WorkbenchFlow from "./WorkbenchFlow";
import DocumentPreviewManager from "./DocumentPreviewManager";
import ExecutionButton from "./ExecutionButton";
import ResultsPanel from "./ResultsPanel";
import SplitScreenLayout from "./SplitScreenLayout";
import { useWorkflowExecution } from "@/hooks/workbench/useWorkflowExecution";
import { useWorkspaceState } from "@/hooks/workbench/useWorkspaceState";

/**
 * WorkbenchContainer Component
 * 
 * Purpose: Main container wrapper for the AI Workbench with save-on-run persistence
 * Now saves workspace only when user clicks Run or navigates away
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
  const [showResults, setShowResults] = useState(false);

  // Use workspace state without auto-save
  const {
    workspace,
    saveStatus,
    isLoading,
    updateNodes,
    updateEdges,
    saveWorkspace
  } = useWorkspaceState();

  // Initialize workflow execution with save functionality
  const {
    executionState,
    executeWorkflow,
    resetExecution,
    isWorkflowValid
  } = useWorkflowExecution(workspace.nodes, workspace.edges, saveWorkspace, workspace);

  // Save workspace when user navigates away
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (workspace.id) {
        try {
          await saveWorkspace(workspace);
        } catch (error) {
          console.error('Failed to save workspace on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workspace, saveWorkspace]);

  const handleExecute = async () => {
    try {
      await executeWorkflow();
      setShowResults(true);
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const handleStopExecution = () => {
    resetExecution();
  };

  const handleCloseResults = () => {
    setShowResults(false);
    resetExecution();
  };

  // Show loading state while workspace is loading
  if (isLoading) {
    return (
      <div className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const workbenchContent = (
    <div className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50">
      <WorkbenchFlow
        {...props}
        ref={ref}
        nodes={workspace.nodes}
        edges={workspace.edges}
        updateNodes={updateNodes}
        updateEdges={updateEdges}
      />
      
      <ExecutionButton
        isExecuting={executionState.isExecuting}
        isWorkflowValid={isWorkflowValid()}
        currentStep={executionState.currentStep}
        totalSteps={executionState.totalSteps}
        error={executionState.error}
        onExecute={handleExecute}
        onStop={handleStopExecution}
      />

      {/* Save status indicator */}
      {saveStatus.isSaving && (
        <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm">
          Saving...
        </div>
      )}
      {saveStatus.lastSaved && !saveStatus.isSaving && (
        <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm">
          Saved
        </div>
      )}
      {saveStatus.error && (
        <div className="absolute top-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm">
          Save failed
        </div>
      )}
    </div>
  );

  const resultsContent = showResults && executionState.finalResult ? (
    <ResultsPanel
      finalResult={executionState.finalResult}
      executionResults={executionState.results}
      onClose={handleCloseResults}
    />
  ) : null;

  return (
    <>
      <SplitScreenLayout
        leftPanel={workbenchContent}
        rightPanel={resultsContent}
        showSplit={showResults}
      />

      <DocumentPreviewManager />
    </>
  );
});

export default WorkbenchContainer;
