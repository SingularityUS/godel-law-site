import {
  ReactFlow,
  MiniMap,
  Background,
  Controls,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Handle,
  Position,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MODULE_DEFINITIONS, AIModuleDefinition, ModuleKind } from "@/data/modules";

import "@xyflow/react/dist/style.css";

// Add index signature for compatibility
interface HelperNodeData extends Record<string, unknown> {
  moduleType: ModuleKind;
  promptOverride?: string;
}

type HelperNode = Node<HelperNodeData>;

type DocumentInputNodeData = {
  moduleType: "document-input";
  documentName: string;
  file: any;
  isDragOver?: boolean;
};

type DocumentInputNode = Node<DocumentInputNodeData>;

// Union type for all nodes
type AllNodes = HelperNode | DocumentInputNode;

const getModuleDef = (type: ModuleKind) => MODULE_DEFINITIONS.find((m) => m.type === type)!;

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

const HelperNodeComponent = ({ data, selected }: { data: HelperNodeData; selected?: boolean }) => {
  const module = getModuleDef(data.moduleType);
  return (
    <div
      className={`min-w-[140px] max-w-[180px] p-3 pr-4 rounded-md shadow-lg border-2 cursor-pointer ${module.color} ${
        selected ? "ring-4 ring-primary/80 z-10" : "ring-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-white drop-shadow">
          <module.icon size={26} />
        </span>
        <span className="font-semibold text-white">{module.label}</span>
      </div>
      <div className="text-xs text-white/95 mt-2 line-clamp-2 italic">
        {data.promptOverride ? "Custom prompt" : "Default prompt"}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-4 bg-black/80" />
      <Handle type="source" position={Position.Right} className="w-2 h-4 bg-black/80" />
    </div>
  );
};

// Extend nodeTypes for document-input
const DocumentInputNodeComponent = ({ data, selected }: { data: DocumentInputNodeData; selected?: boolean }) => {
  return (
    <div
      className={`min-w-[140px] max-w-[220px] p-3 pr-4 rounded-md shadow-lg border-2 cursor-pointer transition-all duration-200 ${
        data.isDragOver 
          ? "bg-blue-200 border-blue-400 ring-2 ring-blue-300" 
          : "bg-slate-100 border-slate-300"
      } ${
        selected ? "ring-4 ring-blue-300 z-10" : "ring-0"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center gap-2">
        <BookOpen size={22} className="text-blue-800" />
        <span className="font-semibold text-blue-900 truncate">{data.documentName}</span>
      </div>
      <div className="text-xs text-gray-700 mt-2">
        {data.isDragOver ? "Drop document here" : "Document input"}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-4 bg-black/80" />
    </div>
  );
};

const nodeTypes = {
  helper: HelperNodeComponent,
  "document-input": DocumentInputNodeComponent,
};

// Props: add uploadedFiles (for document dropping) and expose addDocumentNode via ref
interface AIWorkbenchProps {
  onModuleEdit: (nodeId: string, node: HelperNode) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
}
import React, { forwardRef, useImperativeHandle } from "react";
import { BookOpen } from "lucide-react";

const AIWorkbench = forwardRef(function AIWorkbench(
  { onModuleEdit, editingPromptNodeId, uploadedFiles }: AIWorkbenchProps,
  ref
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<AllNodes>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Add document node method
  useImperativeHandle(ref, () => ({
    addDocumentNode: (file: any) => {
      // Position new doc nodes at a default pos if not dropped
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

  // Helper function to get node at coordinates using DOM elements
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return null;
    
    // Convert screen coordinates to flow coordinates
    const flowX = x - reactFlowBounds.left;
    const flowY = y - reactFlowBounds.top;
    
    // Find node that contains this point (approximate check)
    return nodes.find(node => {
      const nodeWidth = 180; // approximate node width
      const nodeHeight = 80; // approximate node height
      return (
        flowX >= node.position.x &&
        flowX <= node.position.x + nodeWidth &&
        flowY >= node.position.y &&
        flowY <= node.position.y + nodeHeight
      );
    });
  }, [nodes]);

  // Clear drag over states
  const clearDragOverStates = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "document-input") {
          return {
            ...node,
            data: { ...node.data, isDragOver: false }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Drag-and-drop from palette or uploaded document
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      clearDragOverStates();
      
      const docData = event.dataTransfer.getData("application/lovable-document");
      if (docData) {
        // File card dropped: check if dropped on existing document node
        const file = JSON.parse(docData);
        const targetNode = getNodeAtPosition(event.clientX, event.clientY);
        
        if (targetNode && targetNode.type === "document-input") {
          // Update existing document input node
          setNodes((nds) =>
            nds.map((node) =>
              node.id === targetNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      documentName: file.name,
                      file: file,
                      isDragOver: false
                    }
                  }
                : node
            )
          );
          return;
        }
        
        // Otherwise create new node
        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        const pos = reactFlowBounds
          ? {
              x: event.clientX - reactFlowBounds.left - 65,
              y: event.clientY - reactFlowBounds.top - 30,
            }
          : { x: 80, y: 420 + Math.random() * 100 };
        const nodeId = `doc-${Date.now()}-${file.name}`;
        const newNode: DocumentInputNode = {
          id: nodeId,
          type: "document-input",
          position: pos,
          data: { moduleType: "document-input" as const, documentName: file.name, file },
          draggable: true,
        };
        setNodes((nds) => [...nds, newNode]);
        return;
      }
      // Otherwise, default: palette module drop
      const transfer = event.dataTransfer.getData("application/json");
      if (!transfer) return;
      const module: AIModuleDefinition = JSON.parse(transfer);
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const pos = reactFlowBounds
        ? {
            x: event.clientX - reactFlowBounds.left - 75,
            y: event.clientY - reactFlowBounds.top - 30,
          }
        : { x: 100, y: 100 };
      const nodeId = (Math.floor(Math.random() * 1e8)).toString();
      const newNode: HelperNode = {
        id: nodeId,
        type: "helper",
        position: pos,
        data: { moduleType: module.type },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, getNodeAtPosition, clearDragOverStates]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    
    // Check if dragging a document
    const docData = event.dataTransfer.types.includes("application/lovable-document");
    if (docData) {
      const targetNode = getNodeAtPosition(event.clientX, event.clientY);
      
      // Update drag over states
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === "document-input") {
            const isDragOver = targetNode?.id === node.id;
            return {
              ...node,
              data: { ...node.data, isDragOver }
            };
          }
          return node;
        })
      );
    }
  }, [getNodeAtPosition, setNodes]);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear if leaving the entire flow area
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as HTMLElement)) {
      clearDragOverStates();
    }
  }, [clearDragOverStates]);

  // Handle node selection for editing prompts
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Only handle helper nodes for editing
      if (node.type === "helper" && (node as HelperNode).data && (node as HelperNode).data.moduleType) {
        onModuleEdit(node.id, node as HelperNode);
      }
    },
    [onModuleEdit]
  );

  // Prompt management
  const updatePromptOverride = useCallback(
    (nodeId: string, promptOverride: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, promptOverride } } : n
        )
      );
    },
    [setNodes]
  );

  // Edge creation and deletion
  const onConnect = useCallback(
    (connection: Connection) => {
      // addEdge expects a real Edge. We'll append data for label on the new edge
      setEdges((eds) =>
        addEdge(
          { ...connection, animated: true, type: "smoothstep", data: { label: "JSON" } },
          eds
        )
      );
    },
    [setEdges]
  );

  // Delete key deletes selected nodes
  useEffect(() => {
    const handleDelete = (ev: KeyboardEvent) => {
      if (ev.key === "Backspace" || ev.key === "Delete") {
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) =>
          eds.filter(
            (edge) =>
              !nodes.find((n) => n.selected && (n.id === edge.source || n.id === edge.target))
          )
        );
      }
    };
    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [setNodes, setEdges, nodes]);

  // Reveal prompt drawer when node is being edited
  const selectedNodeId =
    editingPromptNodeId ?? nodes.find((n) => n.selected)?.id;

  return (
    <div ref={reactFlowWrapper} className="w-full grow h-[650px] relative rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50">
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
        <MiniMap 
          nodeColor={(n) => {
            const nodeData = n.data as HelperNodeData | DocumentInputNodeData;
            if (nodeData.moduleType === "document-input") {
              return "#e2e8f0"; // slate-200 for document nodes
            }
            return getModuleDef(nodeData.moduleType as ModuleKind).color.replace("bg-", "");
          }}
          pannable zoomable
        />
        <Controls />
        <Background gap={20} size={2} color="#cad2e3" />
      </ReactFlow>
    </div>
  );
});

export default AIWorkbench;
