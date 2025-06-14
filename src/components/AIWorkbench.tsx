
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
  useReactFlow,
  Handle,
  Position,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MODULE_DEFINITIONS, AIModuleDefinition, ModuleKind } from "@/data/modules";

import "@xyflow/react/dist/style.css";

interface HelperNodeData {
  moduleType: ModuleKind;
  promptOverride?: string;
}

type HelperNode = Node<HelperNodeData>;

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
  { id: "e1-2", source: "1", target: "2", animated: true, label: "JSON", type: "smoothstep" },
  { id: "e2-3", source: "2", target: "3", animated: true, label: "JSON", type: "smoothstep" },
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
        <module.icon size={26} className="text-white drop-shadow" />
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

const nodeTypes = {
  helper: HelperNodeComponent,
};

interface AIWorkbenchProps {
  onModuleEdit: (nodeId: string, node: HelperNode) => void;
  editingPromptNodeId?: string;
}

const AIWorkbench = ({ onModuleEdit, editingPromptNodeId }: AIWorkbenchProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Module drag-and-drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
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
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle node selection for editing prompts
  const onNodeClick = useCallback(
    (_: unknown, node: HelperNode) => {
      onModuleEdit(node.id, node);
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
    (connection: Edge | Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, label: "JSON" }, eds)),
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
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep", animated: true, style: { stroke: "#333" } }}
      >
        <MiniMap 
          nodeColor={(n) =>
            getModuleDef(n.data.moduleType as ModuleKind).color.replace("bg-", "")
          }
          pannable zoomable
        />
        <Controls />
        <Background gap={20} size={2} color="#cad2e3" />
      </ReactFlow>
    </div>
  );
};

export default AIWorkbench;
