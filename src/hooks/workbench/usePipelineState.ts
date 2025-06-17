
/**
 * usePipelineState Hook
 * 
 * Purpose: Manages execution state for pipeline
 */

import { useState, useCallback } from "react";
import { ExecutionState } from "./types/pipelineTypes";

export const usePipelineState = () => {
  const [executionState, setExecutionState] = useState<ExecutionState>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalOutput, setFinalOutput] = useState<any>(null);

  const updateNodeStatus = useCallback((nodeId: string, status: ExecutionState[string]) => {
    setExecutionState(prev => ({
      ...prev,
      [nodeId]: status
    }));
  }, []);

  const initializeState = useCallback((executionOrder: string[]) => {
    const newExecutionState: ExecutionState = {};
    executionOrder.forEach(nodeId => {
      newExecutionState[nodeId] = { status: 'queued' };
    });
    setExecutionState(newExecutionState);
  }, []);

  const resetState = useCallback(() => {
    setExecutionState({});
    setFinalOutput(null);
    setIsExecuting(false);
  }, []);

  const getNodeExecutionStatus = useCallback((nodeId: string) => {
    return executionState[nodeId] || { status: 'idle' };
  }, [executionState]);

  return {
    executionState,
    isExecuting,
    finalOutput,
    setIsExecuting,
    setFinalOutput,
    updateNodeStatus,
    initializeState,
    resetState,
    getNodeExecutionStatus
  };
};
