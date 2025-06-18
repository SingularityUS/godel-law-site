
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
  onOpenSidebar: () => void;
}

export const useExecutionKeyboard = ({ 
  isValid, 
  isExecuting, 
  onExecute,
  onOpenSidebar
}: UseExecutionKeyboardProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        console.log('⌨️ useExecutionKeyboard: Ctrl+Enter detected');
        console.log('⌨️ useExecutionKeyboard: isValid:', isValid, 'isExecuting:', isExecuting);
        
        if (isValid && !isExecuting) {
          console.log('⌨️ useExecutionKeyboard: Opening sidebar and executing');
          // Open sidebar first, then execute
          onOpenSidebar();
          onExecute();
        } else {
          console.log('⌨️ useExecutionKeyboard: Execution blocked - invalid or already executing');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isValid, isExecuting, onExecute, onOpenSidebar]);
};
