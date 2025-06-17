
/**
 * useExecutionKeyboard Hook
 * 
 * Purpose: Handles keyboard shortcuts for pipeline execution
 */

import { useEffect } from "react";

interface UseExecutionKeyboardProps {
  isValid: boolean;
  isExecuting: boolean;
  onExecute: () => void;
}

export const useExecutionKeyboard = ({ isValid, isExecuting, onExecute }: UseExecutionKeyboardProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (isValid && !isExecuting) {
          onExecute();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isValid, isExecuting, onExecute]);
};
