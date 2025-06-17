
/**
 * useExecutionState Hook
 * 
 * Purpose: Manages workflow execution state
 * Handles state updates during workflow execution
 */

import { useState, useCallback } from "react";

export interface ExecutionState {
  isExecuting: boolean;
  currentStep: number;
  totalSteps: number;
  executionOrder: string[];
  results: Record<string, any>;
  finalResult: any;
  error: string | null;
}

const initialState: ExecutionState = {
  isExecuting: false,
  currentStep: 0,
  totalSteps: 0,
  executionOrder: [],
  results: {},
  finalResult: null,
  error: null
};

export const useExecutionState = () => {
  const [executionState, setExecutionState] = useState<ExecutionState>(initialState);

  const startExecution = useCallback((executionOrder: string[]) => {
    setExecutionState({
      isExecuting: true,
      currentStep: 0,
      totalSteps: executionOrder.length,
      executionOrder,
      results: {},
      finalResult: null,
      error: null
    });
  }, []);

  const updateCurrentStep = useCallback((step: number) => {
    setExecutionState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const completeExecution = useCallback((results: Record<string, any>, finalResult: any) => {
    setExecutionState(prev => ({
      ...prev,
      isExecuting: false,
      results,
      finalResult
    }));
  }, []);

  const setExecutionError = useCallback((error: string) => {
    setExecutionState(prev => ({
      ...prev,
      isExecuting: false,
      error
    }));
  }, []);

  const resetExecution = useCallback(() => {
    setExecutionState(initialState);
  }, []);

  return {
    executionState,
    startExecution,
    updateCurrentStep,
    completeExecution,
    setExecutionError,
    resetExecution
  };
};
