
/**
 * useWorkbenchDragDrop Hook
 * 
 * Purpose: Centralized drag-and-drop handling for the AI Workbench
 * This hook manages all drag-drop operations including document drops
 * from the library and module drops from the palette.
 * 
 * Key Responsibilities:
 * - Handles document file drops for node creation and replacement
 * - Manages module palette drops for new helper nodes
 * - Provides visual feedback during drag operations
 * - Maintains drag-over states for user feedback
 * 
 * Integration Points:
 * - Uses workbench state setters for node manipulation
 * - Creates getNodeAtPosition internally for target detection
 * - Handles React Flow container coordinate transformations
 * - Manages custom event dispatching for UI feedback
 * 
 * Event Flow:
 * 1. Drag operations start in DocumentLibrary or ModulePalette
 * 2. This hook processes drag-over events for visual feedback
 * 3. Drop events create new nodes or update existing ones
 * 4. Drag-leave events clean up visual states
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { getNodeAtScreenPosition } from "@/utils/nodeUtils";

// Type definition for all supported node types in the workbench
type AllNodes = Node<any>;

interface UseWorkbenchDragDropProps {
  nodes: AllNodes[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

export const useWorkbenchDragDrop = ({
  nodes,
  setNodes,
  reactFlowWrapper
}: UseWorkbenchDragDropProps) => {

  /**
   * Helper function to get node at coordinates using DOM elements
   * This is used for drag-and-drop operations to find target nodes
   */
  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    return getNodeAtScreenPosition(nodes, x, y, reactFlowBounds);
  }, [nodes, reactFlowWrapper]);

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
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
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
    [setNodes, getNodeAtPosition, clearDragOverStates, reactFlowWrapper]
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
   */
  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear states if actually leaving the container
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as HTMLElement)) {
      clearDragOverStates();
    }
  }, [clearDragOverStates, reactFlowWrapper]);

  return {
    onDrop,
    onDragOver,
    onDragLeave
  };
};
