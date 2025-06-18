
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

export const useExecutionKeyboard = ({ 
  isValid, 
  isExecuting, 
  onExecute
}: UseExecutionKeyboardProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        console.log('⌨️ useExecutionKeyboard: Ctrl+Enter detected');
        console.log('⌨️ useExecutionKeyboard: isValid:', isValid, 'isExecuting:', isExecuting);
        
        if (isValid && !isExecuting) {
          console.log('⌨️ useExecutionKeyboard: Calling onExecute');
          // Use the same execution function as the button
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
  }, [isValid, isExecuting, onExecute]);
};
