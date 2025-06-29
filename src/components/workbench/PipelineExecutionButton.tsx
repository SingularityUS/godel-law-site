
/**
 * PipelineExecutionButton Component
 * 
 * Purpose: Provides controls for running the legal document processing pipeline
 * Enhanced with legal-specific validation and guidance
 */

import React from "react";
import { AllNodes } from "@/types/workbench";
import { Edge } from "@xyflow/react";
import PipelineValidation from "./PipelineValidation";
import ExecutionControls from "./ExecutionControls";
import { useExecutionKeyboard } from "@/hooks/workbench/useExecutionKeyboard";

interface PipelineExecutionButtonProps {
  nodes: AllNodes[];
  edges: Edge[];
  isExecuting: boolean;
  onExecute: () => void;
  onStop: () => void;
  onOpenSidebar: () => void;
}

const PipelineExecutionButton: React.FC<PipelineExecutionButtonProps> = ({
  nodes,
  edges,
  isExecuting,
  onExecute,
  onStop,
  onOpenSidebar
}) => {
  // Validate pipeline to check if execution is possible
  const validatePipeline = () => {
    const documentInputNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    
    if (documentInputNodes.length === 0) {
      return false;
    }

    // Check if there are any connected processing modules
    const hasConnectedNodes = edges.some(edge => 
      documentInputNodes.some(doc => doc.id === edge.source)
    );

    return hasConnectedNodes;
  };

  const isValid = validatePipeline();

  const handleExecute = () => {
    console.log('🚀 PipelineExecutionButton: handleExecute called');
    
    // Open sidebar immediately with direct callback
    console.log('📡 PipelineExecutionButton: Calling onOpenSidebar directly');
    onOpenSidebar();
    console.log('✅ PipelineExecutionButton: onOpenSidebar called');
    
    // Execute the pipeline
    console.log('⚡ PipelineExecutionButton: Calling onExecute');
    onExecute();
  };

  // Add keyboard event handler for Ctrl+Enter
  useExecutionKeyboard({ 
    isValid, 
    isExecuting, 
    onExecute: handleExecute,
    onOpenSidebar
  });

  return (
    <div className="flex items-center gap-3">
      <PipelineValidation nodes={nodes} edges={edges} />
      <ExecutionControls
        isExecuting={isExecuting}
        isValid={isValid}
        onExecute={handleExecute}
        onStop={onStop}
      />
    </div>
  );
};

export default PipelineExecutionButton;
