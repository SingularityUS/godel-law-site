
import React from "react";
import { Handle, Position, Node } from "@xyflow/react";
import { X } from "lucide-react";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";

/**
 * HelperNode Component
 * 
 * Purpose: Renders AI processing module nodes in the workflow graph
 * These nodes represent different AI operations (text extraction, grammar checking, etc.)
 * that can be chained together to create complex document processing pipelines.
 * 
 * Features:
 * - Displays module icon, name, and prompt status
 * - Color-coded based on module type
 * - Handles selection states for prompt editing
 * - Includes delete functionality
 * 
 * Integration:
 * - Used by AIWorkbench as a custom node type
 * - Connects to other nodes via React Flow edges
 * - Triggers prompt editing when clicked
 * - References MODULE_DEFINITIONS for styling and metadata
 */

// Add index signature for compatibility with React Flow
interface HelperNodeData extends Record<string, unknown> {
  moduleType: ModuleKind;
  promptOverride?: string;
}

export type HelperNode = Node<HelperNodeData>;

interface HelperNodeProps {
  data: HelperNodeData;
  selected?: boolean;
  id: string;
}

/**
 * Helper function to get module definition from the modules registry
 */
const getModuleDef = (type: ModuleKind) => MODULE_DEFINITIONS.find((m) => m.type === type)!;

const HelperNodeComponent: React.FC<HelperNodeProps> = ({ 
  data, 
  selected, 
  id 
}) => {
  const module = getModuleDef(data.moduleType);
  
  /**
   * Handles node deletion by dispatching a custom event
   * This allows the parent AIWorkbench to handle the actual node removal
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`min-w-[140px] max-w-[180px] p-3 pr-4 rounded-md shadow-lg border-2 cursor-pointer relative ${module.color} ${
        selected ? "ring-4 ring-primary/80 z-10" : "ring-0"
      }`}
    >
      {/* Delete button - only visible on hover or when selected */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-20 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        style={{ opacity: selected ? 1 : undefined }}
        aria-label="Delete helper node"
      >
        <X size={12} />
      </button>
      
      {/* Module icon and label */}
      <div className="flex items-center gap-3">
        <span className="text-white drop-shadow">
          <module.icon size={26} />
        </span>
        <span className="font-semibold text-white">{module.label}</span>
      </div>
      
      {/* Prompt status indicator */}
      <div className="text-xs text-white/95 mt-2 line-clamp-2 italic">
        {data.promptOverride ? "Custom prompt" : "Default prompt"}
      </div>
      
      {/* React Flow handles for connecting to other nodes */}
      <Handle type="target" position={Position.Left} className="w-2 h-4 bg-black/80" />
      <Handle type="source" position={Position.Right} className="w-2 h-4 bg-black/80" />
    </div>
  );
};

export default HelperNodeComponent;
