
import React from "react";
import { MiniMap, Controls, Background, Node } from "@xyflow/react";
import PipelineExecutionButton from "./PipelineExecutionButton";
import { AllNodes } from "@/types/workbench";
import { Edge } from "@xyflow/react";

/**
 * WorkbenchControls Component
 * 
 * Purpose: Renders React Flow controls and visual elements
 * This component provides the minimap, zoom controls, background
 * grid pattern, and pipeline execution controls for the AI Workbench interface.
 */

interface WorkbenchControlsProps {
  getNodeColor: (node: Node) => string;
  nodes: AllNodes[];
  edges: Edge[];
  isExecuting: boolean;
  onExecutePipeline: () => void;
  onStopPipeline: () => void;
}

const WorkbenchControls: React.FC<WorkbenchControlsProps> = ({ 
  getNodeColor, 
  nodes, 
  edges, 
  isExecuting, 
  onExecutePipeline, 
  onStopPipeline
}) => {
  return (
    <>
      {/* Pipeline execution controls - positioned at top right */}
      <div className="absolute top-4 right-4 z-10">
        <PipelineExecutionButton
          nodes={nodes}
          edges={edges}
          isExecuting={isExecuting}
          onExecute={onExecutePipeline}
          onStop={onStopPipeline}
        />
      </div>

      {/* Minimap for navigation */}
      <MiniMap 
        nodeColor={getNodeColor}
        pannable 
        zoomable
      />
      
      {/* Flow controls (zoom, pan, etc.) */}
      <Controls />
      
      {/* Background grid pattern */}
      <Background gap={20} size={2} color="#cad2e3" />
    </>
  );
};

export default WorkbenchControls;
