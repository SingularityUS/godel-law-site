
import React, { forwardRef, useImperativeHandle, useCallback, useEffect } from "react";
import { ReactFlow, Node } from "@xyflow/react";
import { HelperNode } from "./HelperNode";
import { DocumentInputNode } from "./DocumentInputNode";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";
import WorkbenchControls from "./WorkbenchControls";
import { useModuleColors } from "@/hooks/useModuleColors";

import "@xyflow/react/dist/style.css";

/**
 * WorkbenchFlow Component
 * 
 * Purpose: Core React Flow implementation for the AI Workbench
 * This component handles the main flow diagram functionality including
 * node management, event handling, and user interactions.
 * 
 * Key Responsibilities:
 * - Manages React Flow state and configuration
 * - Handles drag-drop operations from palette and library
 * - Processes node clicks for editing and preview
 * - Provides imperative API for external document addition
 * - Coordinates with event handling hooks
 * 
 * Integration Points:
 * - Uses useWorkbenchEvents for complex event management
 * - Integrates with useModuleColors for visual customization
 * - Communicates with parent components via callbacks
 * - Exposes addDocumentNode method for external use
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

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true, type: "smoothstep", data: { label: "JSON" } },
  { id: "e2-3", source: "2", target: "3", animated: true, type: "smoothstep", data: { label: "JSON" } },
];

// Register custom node types with React Flow
const nodeTypes = {
  helper: require("./HelperNode").default,
  "document-input": require("./DocumentInputNode").default,
};

interface WorkbenchFlowProps {
  onModuleEdit: (nodeId: string, node: HelperNode) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, reactFlowWrapper },
  ref
) {
  const { getModuleColor } = useModuleColors();

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
    [handleDrop, reactFlowWrapper]
  );

  /**
   * Wraps the drag leave handler to include container reference
   */
  const onDragLeave = useCallback(
    (event: React.DragEvent) => handleDragLeave(event, reactFlowWrapper),
    [handleDragLeave, reactFlowWrapper]
  );

  /**
   * Handles node clicks for both editing and preview functionality
   */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "document-input") {
        // Handle document nodes for preview
        const docNode = node as DocumentInputNode;
        if (docNode.data?.file) {
          const previewEvent = new CustomEvent('openDocumentPreview', {
            detail: {
              name: docNode.data.documentName,
              type: docNode.data.file.type,
              size: docNode.data.file.size,
              preview: docNode.data.file.preview,
              file: docNode.data.file
            }
          });
          window.dispatchEvent(previewEvent);
        }
      }
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
      <WorkbenchControls getNodeColor={getNodeColor} />
    </ReactFlow>
  );
});

export default WorkbenchFlow;
