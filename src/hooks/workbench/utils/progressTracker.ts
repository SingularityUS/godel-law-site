
/**
 * Progress Tracker Utility
 * 
 * Purpose: Centralized progress tracking for module processing
 */

import { ModuleProgress } from "./moduleProgress";
import { ModuleKind } from "@/data/modules";

export const createProgressTracker = (
  moduleType: ModuleKind,
  onProgress?: (progress: ModuleProgress) => void
) => {
  
  const reportStart = (total: number, inputType: string = 'items') => {
    if (onProgress) {
      onProgress({
        completed: 0,
        total,
        moduleType,
        inputType
      });
    }
  };

  const reportProgress = (completed: number, total: number, outputGenerated?: number) => {
    if (onProgress) {
      const progress: ModuleProgress = {
        completed,
        total,
        moduleType,
        inputType: getInputType(moduleType),
        outputGenerated
      };
      
      // Add output type information
      if (moduleType === 'paragraph-splitter') {
        progress.outputType = 'paragraphs';
      } else if (moduleType === 'grammar-checker') {
        progress.outputType = 'errors';
      }
      
      onProgress(progress);
    }
  };

  const reportCompletion = (total: number, outputGenerated?: number) => {
    if (onProgress) {
      onProgress({
        completed: total,
        total,
        moduleType,
        inputType: getInputType(moduleType),
        outputGenerated
      });
    }
  };

  return {
    reportStart,
    reportProgress,
    reportCompletion
  };
};

function getInputType(moduleType: ModuleKind): string {
  switch (moduleType) {
    case 'paragraph-splitter':
      return 'chunks';
    case 'grammar-checker':
      return 'paragraphs';
    default:
      return 'documents';
  }
}
