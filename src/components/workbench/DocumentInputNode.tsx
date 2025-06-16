
import React from "react";
import { Handle, Position, Node } from "@xyflow/react";
import { BookOpen, X } from "lucide-react";

/**
 * DocumentInputNode Component
 * 
 * Purpose: Renders document input nodes in the AI workflow graph
 * This component represents uploaded documents that can be used as input for AI processing modules.
 * 
 * Features:
 * - Displays document name and metadata
 * - Handles drag-over states for document replacement
 * - Provides visual feedback for user interactions
 * - Includes delete functionality
 * 
 * Integration:
 * - Used by AIWorkbench as a custom node type
 * - Connects to HelperNodes via React Flow edges
 * - Triggers document preview when clicked
 * - Supports drag-and-drop document replacement
 */

export type DocumentInputNodeData = {
  moduleType: "document-input";
  documentName: string;
  file: any;
  isDragOver?: boolean;
};

export type DocumentInputNode = Node<DocumentInputNodeData>;

interface DocumentInputNodeProps {
  data: DocumentInputNodeData;
  selected?: boolean;
  id: string;
}

const DocumentInputNodeComponent: React.FC<DocumentInputNodeProps> = ({ 
  data, 
  selected,
  id 
}) => {
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
      className={`min-w-[140px] max-w-[220px] p-3 pr-4 rounded-md shadow-lg border-2 cursor-pointer transition-all duration-200 relative group hover:shadow-xl ${
        data.isDragOver 
          ? "bg-blue-200 border-blue-400 ring-2 ring-blue-300" 
          : "bg-slate-100 border-slate-300 hover:bg-slate-200"
      } ${
        selected ? "ring-4 ring-blue-300 z-10" : "ring-0"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      title="Click to preview document"
    >
      {/* Delete button - only visible on hover or when selected */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-20 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        style={{ opacity: selected ? 1 : undefined }}
        aria-label="Delete document node"
      >
        <X size={12} />
      </button>

      {/* Document icon and name */}
      <div className="flex items-center gap-2">
        <BookOpen size={22} className="text-blue-800" />
        <span className="font-semibold text-blue-900 truncate">{data.documentName}</span>
      </div>
      
      {/* Status text */}
      <div className="text-xs text-gray-700 mt-2">
        {data.isDragOver ? "Drop document here" : `Click to preview • ${data.documentName}`}
      </div>
      
      {/* React Flow handle for connecting to other nodes */}
      <Handle type="source" position={Position.Right} className="w-2 h-4 bg-black/80" />
    </div>
  );
};

export default DocumentInputNodeComponent;
