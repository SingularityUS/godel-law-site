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
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`w-32 h-24 border-2 border-black cursor-pointer relative group hover:shadow-lg ${
        data.isDragOver 
          ? "bg-gray-200 ring-2 ring-black" 
          : "bg-white"
      } ${
        selected ? "ring-4 ring-black z-10" : "ring-0"
      }`}
      style={{ fontFamily: 'Courier New, monospace' }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      title="Click to preview document"
    >
      {/* Delete button - only visible on hover or when selected */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white flex items-center justify-center text-xs z-20 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        style={{ opacity: selected ? 1 : undefined }}
        aria-label="Delete document node"
      >
        ×
      </button>

      {/* Document content */}
      <div className="flex flex-col items-center justify-center h-full p-2">
        <BookOpen size={20} className="text-black mb-1" />
        <span className="text-xs font-bold text-black text-center leading-tight truncate w-full">
          {data.documentName}
        </span>
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-1 left-1 text-xs text-black">
        {data.isDragOver ? "●" : "○"}
      </div>
      
      {/* React Flow handle - square style */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-black border-none rounded-none" 
      />
    </div>
  );
};

export default DocumentInputNodeComponent;
