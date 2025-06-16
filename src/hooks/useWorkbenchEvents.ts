
import { useCallback, useEffect } from "react";
import { useNodesState, useEdgesState, addEdge, Connection, Node, Edge } from "@xyflow/react";

/**
 * useWorkbenchEvents Hook
 * 
 * Purpose: Manages event handling and state for the AI Workbench
 * This hook encapsulates all the complex event logic for node management,
 * drag-and-drop operations, and user interactions.
 * 
 * Features:
 * - Node and edge state management
 * - Drag and drop handling for modules and documents
 * - Node deletion via keyboard and UI
 * - Document replacement on existing nodes
 * 
 * Integration:
 * - Used by AIWorkbench to manage React Flow state
 * - Coordinates with DocumentInputNode and HelperNode components
 * - Handles communication between different parts of the workbench
 * 
 * @param initialNodes - Initial node configuration
 * @param initialEdges - Initial edge configuration
 * @param getNodeAtPosition - Function to find nodes at specific coordinates
 * @returns Object containing state and event handlers
 */

type AllNodes = Node<any>;

interface UseWorkbenchEventsProps {
  initialNodes: AllNodes[];
  initialEdges: Edge[];
  getNodeAtPosition: (x: number, y: number) => Node | null;
}

export const useWorkbenchEvents = ({
  initialNodes,
  initialEdges,
  getNodeAtPosition
}: UseWorkbenchEventsProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AllNodes>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /**
   * Handles node deletion via custom events
   * This allows child components to trigger node deletion without direct access to state
   */
  useEffect(() => {
    const handleDeleteNode = (event: any) => {
      const { nodeId } = event.detail;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    };

    window.addEventListener('deleteNode', handleDeleteNode);
    return () => window.removeEventListener('deleteNode', handleDeleteNode);
  }, [setNodes, setEdges]);

  /**
   * Clears drag-over states from all document input nodes
   * Used to reset visual feedback after drag operations
   */
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

  /**
   * Handles drop events for both module palette items and document files
   * Supports creating new nodes or updating existing document nodes
   */
  const onDrop = useCallback(
    (event: React.DragEvent, reactFlowWrapper: React.RefObject<HTMLDivElement>) => {
      event.preventDefault();
      clearDragOverStates();
      
      // Handle document file drops
      const docData = event.dataTransfer.getData("application/lovable-document");
      if (docData) {
        const fileData = JSON.parse(docData);
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
                      documentName: fileData.name,
                      file: fileData,
                      isDragOver: false
                    }
                  }
                : node
            )
          );
          return;
        }
        
        // Create new document input node
        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        const pos = reactFlowBounds
          ? {
              x: event.clientX - reactFlowBounds.left - 65,
              y: event.clientY - reactFlowBounds.top - 30,
            }
          : { x: 80, y: 420 + Math.random() * 100 };
        
        const nodeId = `doc-${Date.now()}-${fileData.name}`;
        const newNode = {
          id: nodeId,
          type: "document-input",
          position: pos,
          data: { moduleType: "document-input" as const, documentName: fileData.name, file: fileData },
          draggable: true,
        };
        setNodes((nds) => [...nds, newNode]);
        return;
      }
      
      // Handle module palette drops
      const transfer = event.dataTransfer.getData("application/json");
      if (!transfer) return;
      
      const module = JSON.parse(transfer);
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const pos = reactFlowBounds
        ? {
            x: event.clientX - reactFlowBounds.left - 75,
            y: event.clientY - reactFlowBounds.top - 30,
          }
        : { x: 100, y: 100 };
      
      const nodeId = (Math.floor(Math.random() * 1e8)).toString();
      const newNode = {
        id: nodeId,
        type: "helper",
        position: pos,
        data: { moduleType: module.type },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, getNodeAtPosition, clearDragOverStates]
  );

  /**
   * Handles drag over events to provide visual feedback
   * Updates document nodes to show drop zones when dragging documents
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    
    const docData = event.dataTransfer.types.includes("application/lovable-document");
    if (docData) {
      const targetNode = getNodeAtPosition(event.clientX, event.clientY);
      
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

  /**
   * Handles drag leave events to clean up visual feedback
   */
  const onDragLeave = useCallback((event: React.DragEvent, reactFlowWrapper: React.RefObject<HTMLDivElement>) => {
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as HTMLElement)) {
      clearDragOverStates();
    }
  }, [clearDragOverStates]);

  /**
   * Handles edge creation between nodes
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...connection, animated: true, type: "smoothstep", data: { label: "JSON" } },
          eds
        )
      );
    },
    [setEdges]
  );

  /**
   * Handles keyboard deletion of selected nodes
   */
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

  return {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onDrop,
    onDragOver,
    onDragLeave,
    onConnect
  };
};
