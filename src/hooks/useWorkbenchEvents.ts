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

  const onDrop = useCallback(
    (event: React.DragEvent, reactFlowWrapper: React.RefObject<HTMLDivElement>) => {
      event.preventDefault();
      console.log('Drop event received in workbench');
      clearDragOverStates();
      
      // Handle document file drops
      const docData = event.dataTransfer.getData("application/lovable-document");
      if (docData) {
        console.log('Document data found:', docData);
        const fileData = JSON.parse(docData);
        console.log('Parsed file data:', fileData);
        
        const targetNode = getNodeAtPosition(event.clientX, event.clientY);
        
        if (targetNode && targetNode.type === "document-input") {
          console.log('Updating existing document node:', targetNode.id);
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
        console.log('React Flow bounds:', reactFlowBounds);
        console.log('Drop position:', { x: event.clientX, y: event.clientY });
        
        const pos = reactFlowBounds
          ? {
              x: event.clientX - reactFlowBounds.left - 65,
              y: event.clientY - reactFlowBounds.top - 30,
            }
          : { x: 80, y: 420 + Math.random() * 100 };
        
        console.log('Calculated position:', pos);
        
        const nodeId = `doc-${Date.now()}-${fileData.name}`;
        const newNode = {
          id: nodeId,
          type: "document-input",
          position: pos,
          data: { moduleType: "document-input" as const, documentName: fileData.name, file: fileData },
          draggable: true,
        };
        
        console.log('Creating new document node:', newNode);
        setNodes((nds) => [...nds, newNode]);
        return;
      }
      
      // Handle module palette drops
      const transfer = event.dataTransfer.getData("application/json");
      if (!transfer) {
        console.log('No transfer data found');
        return;
      }
      
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

  const onDragLeave = useCallback((event: React.DragEvent, reactFlowWrapper: React.RefObject<HTMLDivElement>) => {
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as HTMLElement)) {
      clearDragOverStates();
    }
  }, [clearDragOverStates]);

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
