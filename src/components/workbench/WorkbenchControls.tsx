
import React from "react";
import { MiniMap, Controls, Background, Node } from "@xyflow/react";

/**
 * WorkbenchControls Component
 * 
 * Purpose: Renders React Flow controls and visual elements
 * This component provides the minimap, zoom controls, and background
 * grid pattern for the AI Workbench interface.
 * 
 * Key Responsibilities:
 * - Renders minimap with custom node coloring
 * - Provides zoom and pan controls
 * - Displays background grid pattern
 * - Maintains consistent visual styling
 * 
 * Integration Points:
 * - Used by WorkbenchFlow as part of React Flow setup
 * - Receives node color function for minimap styling
 * - Coordinates with overall workbench theming
 */

interface WorkbenchControlsProps {
  getNodeColor: (node: Node) => string;
}

const WorkbenchControls: React.FC<WorkbenchControlsProps> = ({ getNodeColor }) => {
  return (
    <>
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
