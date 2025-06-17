
/**
 * ExecutionButton Component
 * 
 * Purpose: Trigger button for workflow execution
 * Positioned in upper-right corner with keyboard shortcut support
 */

import React, { useEffect } from "react";
import { Play, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutionButtonProps {
  isExecuting: boolean;
  isWorkflowValid: boolean;
  currentStep: number;
  totalSteps: number;
  error: string | null;
  onExecute: () => void;
  onStop: () => void;
}

const ExecutionButton: React.FC<ExecutionButtonProps> = ({
  isExecuting,
  isWorkflowValid,
  currentStep,
  totalSteps,
  error,
  onExecute,
  onStop
}) => {
  // Handle Enter key shortcut
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.ctrlKey && !isExecuting && isWorkflowValid) {
        onExecute();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isExecuting, isWorkflowValid, onExecute]);

  const getButtonContent = () => {
    if (isExecuting) {
      return (
        <>
          <Square size={16} />
          <span>Stop ({currentStep}/{totalSteps})</span>
        </>
      );
    }

    if (error) {
      return (
        <>
          <AlertCircle size={16} />
          <span>Error</span>
        </>
      );
    }

    return (
      <>
        <Play size={16} />
        <span>Run (Ctrl+Enter)</span>
      </>
    );
  };

  const getButtonVariant = () => {
    if (error) return "destructive";
    if (isExecuting) return "secondary";
    return "default";
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <Button
        onClick={isExecuting ? onStop : onExecute}
        disabled={!isWorkflowValid && !isExecuting}
        variant={getButtonVariant()}
        size="sm"
        className="shadow-lg"
        title={
          !isWorkflowValid 
            ? "Connect modules to create a valid workflow" 
            : "Execute workflow (Ctrl+Enter)"
        }
      >
        {getButtonContent()}
      </Button>
      
      {isExecuting && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          Processing step {currentStep} of {totalSteps}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-xs text-red-600 text-center max-w-48">
          {error}
        </div>
      )}
    </div>
  );
};

export default ExecutionButton;
