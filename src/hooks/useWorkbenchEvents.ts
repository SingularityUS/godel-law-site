
/**
 * useWorkbenchEvents Hook
 * 
 * Purpose: Centralized event handling system for the AI Workbench
 * This hook encapsulates all complex event logic for node management, drag-and-drop operations,
 * and user interactions within the React Flow workspace.
 * 
 * Key Responsibilities:
 * - Node and edge state management using React Flow hooks
 * - Drag-and-drop handling for both modules (from palette) and documents (from library)
 * - Node deletion via keyboard shortcuts and UI interactions
 * - Document replacement on existing nodes through drag operations
 * - Visual feedback management for drag-over states
 * 
 * Integration Points:
 * - Used exclusively by AIWorkbench component for React Flow state management
 * - Coordinates with DocumentInputNode and HelperNode components via custom events
 * - Handles communication between ModulePalette and DocumentLibrary drag sources
 * - Manages React Flow's internal state while providing external event interfaces
 * 
 * Event Flow:
 * 1. Mouse/keyboard events trigger handlers in this hook
 * 2. Hook updates React Flow state (nodes, edges)
 * 3. State changes trigger re-renders in connected components
 * 4. Custom events allow child components to trigger parent state changes
 * 
 * Architecture Benefits:
 * - Separation of concerns: UI components focus on rendering, this hook handles logic
 * - Centralized state management prevents prop drilling
 * - Custom event system allows loose coupling between components
 * - Testable: Hook can be tested independently of UI components
 */

import { useCallback, useEffect } from "react";
import { useNodesState, useEdgesState, addEdge, Connection, Node, Edge } from "@xyflow/react";

// Type definition for all supported node types in the workbench
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
  // React Flow state management hooks
  // These provide the core state and change handlers for the flow diagram
  const [nodes, setNodes, onNodesChange] = useNodesState<AllNodes>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /**
   * Custom Event Handler: Node Deletion
   * 
   * Listens for deleteNode events dispatched by child components
   * This pattern allows child components to trigger parent state changes
   * without direct prop passing, maintaining loose coupling
   * 
   * Event Flow:
   * 1. Child component (HelperNode/DocumentInputNode) dispatches deleteNode event
   * 2. This handler receives the event and extracts nodeId
   * 3. Node and related edges are removed from state
   * 4. React Flow re-renders with updated state
   */
  useEffect(() => {
    const handleDeleteNode = (event: any) => {
      const { nodeId } = event.detail;
      // Remove the node from the nodes array
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Remove all edges connected to this node
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    };

    window.addEventListener('deleteNode', handleDeleteNode);
    return () => window.removeEventListener('deleteNode', handleDeleteNode);
  }, [setNodes, setEdges]);

  /**
   * Visual Feedback Helper: Clear Drag-Over States
   * 
   * Resets drag-over visual indicators on all document input nodes
   * Used after drag operations complete to clean up UI state
   * 
   * Implementation Note:
   * Only affects document-input type nodes as they support drag-over styling
   * Helper nodes don't need drag-over states as they don't accept document drops
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
   * Main Drop Handler: Processes All Drop Operations
   * 
   * Handles two types of drops:
   * 1. Document drops from DocumentLibrary (application/lovable-document)
   * 2. Module drops from ModulePalette (application/json)
   * 
   * Document Drop Flow:
   * 1. Extract document data from drag transfer
   * 2. Check if dropping on existing document node (replacement)
   * 3. If replacement: update existing node data
   * 4. If new: create new document node at drop position
   * 
   * Module Drop Flow:
   * 1. Extract module data from drag transfer
   * 2. Calculate position based on drop coordinates and container bounds
   * 3. Create new helper node with module configuration
   * 
   * @param event - Drag event containing transfer data
   * @param reactFlowWrapper - Ref to container for position calculations
   */
  const onDrop = useCallback(
    (event: React.DragEvent, reactFlowWrapper: React.RefObject<HTMLDivElement>) => {
      event.preventDefault();
      console.log('Drop event received in workbench');
      clearDragOverStates();
      
      // Handle document file drops from library
      const docData = event.dataTransfer.getData("application/lovable-document");
      if (docData) {
        console.log('Document data found:', docData);
        const fileData = JSON.parse(docData);
        console.log('Parsed file data:', fileData);
        
        // Check if dropping on an existing document node for replacement
        const targetNode = getNodeAtPosition(event.clientX, event.clientY);
        
        if (targetNode && targetNode.type === "document-input") {
          console.log('Updating existing document node:', targetNode.id);
          // Update existing document input node with new document
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
        
        // Create new document input node at drop position
        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        console.log('React Flow bounds:', reactFlowBounds);
        console.log('Drop position:', { x: event.clientX, y: event.clientY });
        
        // Calculate position within React Flow coordinate system
        const pos = reactFlowBounds
          ? {
              x: event.clientX - reactFlowBounds.left - 65,
              y: event.clientY - reactFlowBounds.top - 30,
            }
          : { x: 80, y: 420 + Math.random() * 100 }; // Fallback position
        
        console.log('Calculated position:', pos);
        
        // Create unique node ID and new document node
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
      
      // Parse module data and create helper node
      const module = JSON.parse(transfer);
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const pos = reactFlowBounds
        ? {
            x: event.clientX - reactFlowBounds.left - 75,
            y: event.clientY - reactFlowBounds.top - 30,
          }
        : { x: 100, y: 100 }; // Fallback position
      
      // Generate unique ID and create helper node
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
   * Drag Over Handler: Provides Visual Feedback During Drag
   * 
   * Manages drag-over states for document input nodes to show users
   * where they can drop documents for replacement operations
   * 
   * Logic:
   * 1. Check if dragging document data
   * 2. Find node under current mouse position
   * 3. Update isDragOver state for document input nodes
   * 4. Only the target node shows drag-over styling
   * 
   * @param event - Drag event with current mouse position
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    
    // Only handle visual feedback for document drags
    const docData = event.dataTransfer.types.includes("application/lovable-document");
    if (docData) {
      const targetNode = getNodeAtPosition(event.clientX, event.clientY);
      
      // Update drag-over states: only target node shows as drag-over
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
   * Drag Leave Handler: Cleans Up Visual States
   * 
   * Removes drag-over styling when drag operations leave the workspace
   * Uses relatedTarget to ensure we only clear when truly leaving the container
   * 
   * @param event - Drag leave event
   * @param reactFlowWrapper - Container ref for boundary checking
   */
  const onDragLeave = useCallback((event: React.DragEvent, reactFlowWrapper: React.RefObject<HTMLDivElement>) => {
    // Only clear states if actually leaving the container
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as HTMLElement)) {
      clearDragOverStates();
    }
  }, [clearDragOverStates]);

  /**
   * Connection Handler: Creates Edges Between Nodes
   * 
   * Called when users connect two nodes by dragging from one handle to another
   * Creates animated edges with metadata for visual appeal and data flow indication
   * 
   * @param connection - Connection object with source and target node IDs
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { 
            ...connection, 
            animated: true, 
            type: "smoothstep", 
            data: { label: "JSON" } // Indicates data format being passed
          },
          eds
        )
      );
    },
    [setEdges]
  );

  /**
   * Keyboard Event Handler: Node Deletion via Keyboard
   * 
   * Implements standard Delete/Backspace functionality for selected nodes
   * Removes both selected nodes and any edges connected to them
   * 
   * Flow:
   * 1. Listen for Delete or Backspace key press
   * 2. Find all selected nodes in current state
   * 3. Remove selected nodes from nodes array
   * 4. Remove edges that connect to any deleted nodes
   */
  useEffect(() => {
    const handleDelete = (ev: KeyboardEvent) => {
      if (ev.key === "Backspace" || ev.key === "Delete") {
        // Remove selected nodes
        setNodes((nds) => nds.filter((n) => !n.selected));
        // Remove edges connected to selected nodes
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

  // Return all state and handlers for use by AIWorkbench component
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
