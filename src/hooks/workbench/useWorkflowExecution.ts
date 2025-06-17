
/**
 * useWorkflowExecution Hook
 * 
 * Purpose: Orchestrates sequential execution of workbench modules
 * Now includes workspace saving before execution
 */

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { useExecutionState } from "./useExecutionState";
import { useTopologicalSort } from "./useTopologicalSort";
import { useModuleExecution } from "./useModuleExecution";

interface WorkspaceData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  isDefault: boolean;
}

export const useWorkflowExecution = (
  nodes: Node[], 
  edges: Edge[], 
  saveWorkspace?: (workspaceData: WorkspaceData) => Promise<void>,
  workspace?: WorkspaceData
) => {
  const {
    executionState,
    startExecution,
    updateCurrentStep,
    completeExecution,
    setExecutionError,
    resetExecution
  } = useExecutionState();

  const { calculateExecutionOrder, isWorkflowValid } = useTopologicalSort();
  const { executeModule } = useModuleExecution();

  /**
   * Execute the entire workflow
   */
  const executeWorkflow = useCallback(async () => {
    try {
      // Save workspace before execution
      if (saveWorkspace && workspace) {
        console.log('Saving workspace before execution...');
        await saveWorkspace(workspace);
      }

      const executionOrder = calculateExecutionOrder(nodes, edges);
      startExecution(executionOrder);

      const results: Record<string, any> = {};
      let currentData: any = null;

      // Execute modules in order
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        
        updateCurrentStep(i + 1);

        // Get input data from previous step or use initial data
        const inputData = i === 0 ? null : currentData;
        
        // Execute the module
        const result = await executeModule(nodeId, nodes, inputData);
        results[nodeId] = result;
        currentData = result;

        // Add delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Execution completed successfully
      completeExecution(results, currentData);
      return currentData;

    } catch (error: any) {
      console.error('Workflow execution failed:', error);
      setExecutionError(error.message || 'Execution failed');
      throw error;
    }
  }, [nodes, edges, calculateExecutionOrder, startExecution, updateCurrentStep, completeExecution, setExecutionError, executeModule, saveWorkspace, workspace]);

  /**
   * Check if workflow is valid for execution
   */
  const checkWorkflowValid = useCallback(() => {
    return isWorkflowValid(nodes, edges);
  }, [nodes, edges, isWorkflowValid]);

  return {
    executionState,
    executeWorkflow,
    resetExecution,
    isWorkflowValid: checkWorkflowValid
  };
};
