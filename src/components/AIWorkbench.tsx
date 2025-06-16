
import React, { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import DocumentPreview from "./DocumentPreview";
import HelperNodeComponent, { HelperNode } from "./workbench/HelperNode";
import DocumentInputNodeComponent, { DocumentInputNode } from "./workbench/DocumentInputNode";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { getModuleDef, getNodeAtScreenPosition } from "@/utils/nodeUtils";
import { useModuleColors } from "@/hooks/useModuleColors";

import "@xyflow/react/dist/style.css";

/**
 * AIWorkbench Component
 * 
 * Purpose: Main visual workflow editor for creating AI document processing pipelines
 * This component provides a drag-and-drop interface where users can connect different
 * AI modules (text extraction, grammar checking, etc.) to create complex workflows.
 * 
 * Key Features:
 * - Visual node-based workflow editor using React Flow
 * - Support for helper nodes (AI modules) and document input nodes
 * - Drag and drop from module palette and uploaded documents
 * - Document preview functionality
 * - Node editing and deletion
 * - Real-time visual feedback for user interactions
 * 
 * Architecture:
 * - Uses custom node components (HelperNode, DocumentInputNode)
 * - Leverages useWorkbenchEvents hook for complex event handling
 * - Integrates with DocumentPreview for document viewing
 * - Exposes imperative API for external document node creation
 * 
 * Integration Points:
 * - Receives uploaded files from parent Index component
 * - Communicates with ModuleSettingsDrawer for module editing
 * - Uses MODULE_DEFINITIONS for node styling and metadata
 */

// Union type for all supported node types
type AllNodes = HelperNode | DocumentInputNode;

// Default workflow configuration
const initialNodes: HelperNode[] = [
  {
    id: "1",
    type: "helper",
    position: { x: 100, y: 220 },
    data: { moduleType: "text-extractor" },
  },
  {
    id: "2",
    type: "helper",
    position: { x: 350, y: 220 },
    data: { moduleType: "paragraph-splitter" },
  },
  {
    id: "3",
    type: "helper",
    position: { x: 600, y: 220 },
    data: { moduleType: "grammar-checker" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, type: "smoothstep", data: { label: "JSON" } },
  { id: "e2-3", source: "2", target: "3", animated: true, type: "smoothstep", data: { label: "JSON" } },
];

// Register custom node types with React Flow
const nodeTypes = {
  helper: HelperNodeComponent,
  "document-input": DocumentInputNodeComponent,
};

interface AIWorkbenchProps {
  onModuleEdit: (nodeId: string, node: HelperNode) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
}

const AIWorkbench = forwardRef<any, AIWorkbenchProps>(function AIWorkbench(
  { onModuleEdit, editingPromptNodeId, uploadedFiles },
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { getModuleColor } = useModuleColors();
  
  // Document preview state
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /**
   * Helper function to get node at coordinates using DOM elements
   * This is used for drag-and-drop operations to find target nodes
   */
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
  }, []);

  // Initialize workbench event handling
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onDrop: handleDrop,
    onDragOver,
    onDragLeave: handleDragLeave,
    onConnect
  } = useWorkbenchEvents({
    initialNodes,
    initialEdges,
    getNodeAtPosition
  });

  /**
   * Listen for settings button clicks from HelperNode components
   */
  useEffect(() => {
    const handleOpenNodeSettings = (event: any) => {
      const { nodeId } = event.detail;
      const node = nodes.find(n => n.id === nodeId) as HelperNode;
      if (node) {
        onModuleEdit(nodeId, node);
      }
    };

    window.addEventListener('openNodeSettings', handleOpenNodeSettings);
    return () => window.removeEventListener('openNodeSettings', handleOpenNodeSettings);
  }, [nodes, onModuleEdit]);

  /**
   * Expose imperative API for adding document nodes from external sources
   * This allows the parent component to programmatically add documents to the workflow
   */
  useImperativeHandle(ref, () => ({
    addDocumentNode: (file: any) => {
      const nodeId = `doc-${Date.now()}-${file.name}`;
      const position = { x: 80, y: 420 + Math.random() * 100 };
      const newNode: DocumentInputNode = {
        id: nodeId,
        type: "document-input",
        position,
        data: { moduleType: "document-input" as const, documentName: file.name, file },
        draggable: true,
      };
      setNodes((nds) => [...nds, newNode]);
    },
  }));

  /**
   * Wraps the drop handler to include container reference
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => handleDrop(event, reactFlowWrapper),
    [handleDrop]
  );

  /**
   * Wraps the drag leave handler to include container reference
   */
  const onDragLeave = useCallback(
    (event: React.DragEvent) => handleDragLeave(event, reactFlowWrapper),
    [handleDragLeave]
  );

  /**
   * Handles node clicks for both editing and preview functionality
   * - Helper nodes: Opens prompt editing drawer via settings button
   * - Document nodes: Opens document preview modal
   */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "document-input") {
        // Handle document nodes for preview
        const docNode = node as DocumentInputNode;
        if (docNode.data?.file) {
          setPreviewDocument({
            name: docNode.data.documentName,
            type: docNode.data.file.type,
            size: docNode.data.file.size,
            preview: docNode.data.file.preview,
            file: docNode.data.file
          });
          setIsPreviewOpen(true);
        }
      }
      // Note: Helper node editing is now handled via settings button clicks
    },
    []
  );

  /**
   * Determines node color for the minimap based on node type and custom colors
   */
  const getNodeColor = (n: Node) => {
    const nodeData = n.data as any;
    if (nodeData.moduleType === "document-input") {
      return "#e2e8f0"; // slate-200 for document nodes
    }
    
    // Use custom color if available, otherwise use default
    const customColor = getModuleColor(n.id);
    const colorClass = customColor.replace("bg-", "");
    
    // Convert Tailwind class to hex for minimap
    const colorMap: { [key: string]: string } = {
      'slate-600': '#475569',
      'gray-600': '#4b5563',
      'red-500': '#ef4444',
      'blue-500': '#3b82f6',
      'green-500': '#22c55e',
      'purple-500': '#a855f7',
      'orange-500': '#f97316',
      'yellow-500': '#eab308'
    };
    
    return colorMap[colorClass] || '#475569';
  };

  return (
    <>
      {/* Main React Flow workspace */}
      <div 
        ref={reactFlowWrapper} 
        className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          panOnScroll
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "smoothstep", animated: true, style: { stroke: "#333" } }}
        >
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
        </ReactFlow>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocument(null);
        }}
        document={previewDocument}
      />
    </>
  );
});

export default AIWorkbench;
