
/**
 * ExecutionControls Component
 * 
 * Purpose: Handles execution button controls for pipeline operations
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

interface ExecutionControlsProps {
  isExecuting: boolean;
  isValid: boolean;
  onExecute: () => void;
  onStop: () => void;
}

const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  isExecuting,
  isValid,
  onExecute,
  onStop
}) => {
  const handleExecute = () => {
    if (isValid && !isExecuting) {
      onExecute();
    }
  };

  const handleStop = () => {
    if (isExecuting) {
      onStop();
    }
  };

  if (isExecuting) {
    return (
      <Button
        onClick={handleStop}
        variant="destructive"
        size="sm"
        className="flex items-center gap-2"
      >
        <Square size={14} />
        Stop
      </Button>
    );
  }

  return (
    <Button
      onClick={handleExecute}
      disabled={!isValid}
      variant="default"
      size="sm"
      className="flex items-center gap-2"
      title="Press Ctrl+Enter to execute"
    >
      <Play size={14} />
      Enter
    </Button>
  );
};

export default ExecutionControls;
