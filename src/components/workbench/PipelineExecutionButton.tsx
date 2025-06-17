
/**
 * PipelineExecutionButton Component
 * 
 * Purpose: Provides controls for running the AI pipeline
 * This component renders the main execution button and handles
 * pipeline validation before execution.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, AlertCircle } from "lucide-react";
import { AllNodes } from "@/types/workbench";
import { Edge } from "@xyflow/react";

interface PipelineExecutionButtonProps {
  nodes: AllNodes[];
  edges: Edge[];
  isExecuting: boolean;
  onExecute: () => void;
  onStop: () => void;
}

const PipelineExecutionButton: React.FC<PipelineExecutionButtonProps> = ({
  nodes,
  edges,
  isExecuting,
  onExecute,
  onStop
}) => {
  // Validate pipeline structure
  const validatePipeline = () => {
    const documentInputNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    
    if (documentInputNodes.length === 0) {
      return { isValid: false, message: 'No document input nodes found. Add a document to start.' };
    }

    // Check if there are any connected helper nodes
    const hasConnectedNodes = edges.some(edge => 
      documentInputNodes.some(doc => doc.id === edge.source)
    );

    if (!hasConnectedNodes) {
      return { isValid: false, message: 'No processing modules connected to document inputs.' };
    }

    return { isValid: true, message: '' };
  };

  const validation = validatePipeline();

  const handleExecute = () => {
    if (validation.isValid && !isExecuting) {
      onExecute();
    }
  };

  const handleStop = () => {
    if (isExecuting) {
      onStop();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!validation.isValid && (
        <div className="flex items-center gap-1 text-yellow-600 text-xs">
          <AlertCircle size={12} />
          <span>{validation.message}</span>
        </div>
      )}
      
      {isExecuting ? (
        <Button
          onClick={handleStop}
          variant="destructive"
          size="sm"
          className="flex items-center gap-1"
        >
          <Square size={14} />
          Stop Pipeline
        </Button>
      ) : (
        <Button
          onClick={handleExecute}
          disabled={!validation.isValid}
          variant="default"
          size="sm"
          className="flex items-center gap-1"
        >
          <Play size={14} />
          Run Pipeline
        </Button>
      )}
    </div>
  );
};

export default PipelineExecutionButton;
