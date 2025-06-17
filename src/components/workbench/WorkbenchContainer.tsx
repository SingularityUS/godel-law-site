import React, { forwardRef, useRef, useState } from "react";
import WorkbenchFlow from "./WorkbenchFlow";
import DocumentPreviewManager from "./DocumentPreviewManager";
import ExecutionButton from "./ExecutionButton";
import ResultsPanel from "./ResultsPanel";
import SplitScreenLayout from "./SplitScreenLayout";
import { useWorkflowExecution } from "@/hooks/workbench/useWorkflowExecution";

/**
 * WorkbenchContainer Component
 * 
 * Purpose: Main container wrapper for the AI Workbench
 * This component provides the physical container and DOM reference needed
 * for React Flow coordinate calculations and drag-drop operations.
 * 
 * Key Responsibilities:
 * - Provides styled container with proper dimensions and background
 * - Maintains DOM reference for coordinate transformations
 * - Passes through all props and refs to child components
 * 
 * Integration Points:
 * - Used by AIWorkbench as the main container
 * - Provides reactFlowWrapper ref to WorkbenchFlow
 * - Coordinates with DocumentPreviewManager for preview functionality
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
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  // Get nodes and edges from WorkbenchFlow (we'll need to pass these up)
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  // Initialize workflow execution
  const {
    executionState,
    executeWorkflow,
    resetExecution,
    isWorkflowValid
  } = useWorkflowExecution(nodes, edges);

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

  // Update nodes and edges when they change in WorkbenchFlow
  const handleNodesChange = (newNodes: any[]) => {
    setNodes(newNodes);
  };

  const handleEdgesChange = (newEdges: any[]) => {
    setEdges(newEdges);
  };

  const workbenchContent = (
    <div className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50">
      <WorkbenchFlow
        {...props}
        ref={ref}
        reactFlowWrapper={reactFlowWrapper}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
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
