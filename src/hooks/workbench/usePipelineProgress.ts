
/**
 * usePipelineProgress Hook
 * 
 * Purpose: Manages progress tracking for pipeline execution
 */

import { useState, useCallback } from "react";

export interface ProgressInfo {
  [nodeId: string]: {
    completed: number;
    total: number;
  };
}

export const usePipelineProgress = () => {
  const [progressInfo, setProgressInfo] = useState<ProgressInfo>({});

  const updateProgress = useCallback((nodeId: string, completed: number, total: number) => {
    setProgressInfo(prev => ({
      ...prev,
      [nodeId]: { completed, total }
    }));
  }, []);

  const clearProgress = useCallback((nodeId: string) => {
    setProgressInfo(prev => {
      const newProgress = { ...prev };
      delete newProgress[nodeId];
      return newProgress;
    });
  }, []);

  const resetAllProgress = useCallback(() => {
    setProgressInfo({});
  }, []);

  return {
    progressInfo,
    updateProgress,
    clearProgress,
    resetAllProgress
  };
};
