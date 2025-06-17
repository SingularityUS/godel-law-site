
/**
 * RunWorkflowButton Component
 * 
 * Purpose: Button to execute the workflow and save workspace
 * Positioned in the upper right corner of the workbench
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Loader2 } from "lucide-react";
import { WorkflowExecutionState } from "@/hooks/workbench/useWorkflowExecution";

interface RunWorkflowButtonProps {
  onRun: () => void;
  onStop: () => void;
  executionState: WorkflowExecutionState;
  disabled?: boolean;
}

const RunWorkflowButton: React.FC<RunWorkflowButtonProps> = ({
  onRun,
  onStop,
  executionState,
  disabled = false
}) => {
  const { isRunning, currentModuleId, error } = executionState;

  if (isRunning) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600">
          {currentModuleId ? `Processing ${currentModuleId}...` : 'Initializing...'}
        </div>
        <Button 
          onClick={onStop}
          variant="destructive" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Square size={16} />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={onRun}
      disabled={disabled}
      size="sm"
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
      style={{ fontFamily: 'Courier New, monospace' }}
    >
      <Play size={16} />
      Run Workflow
    </Button>
  );
};

export default RunWorkflowButton;
