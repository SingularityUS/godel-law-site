
/**
 * useWorkbenchDragDrop Hook
 * 
 * Purpose: Centralized drag-and-drop handling for the AI Workbench
 * Refactored to use focused sub-hooks for better maintainability
 * 
 * Key Responsibilities:
 * - Orchestrates document and module drop operations
 * - Coordinates with specialized positioning and state hooks
 * - Maintains clean separation of drag-drop concerns
 * 
 * Integration Points:
 * - Uses positioning hook for coordinate calculations
 * - Uses drag state hook for visual feedback
 * - Handles React Flow container coordinate transformations
 * - Manages custom event dispatching for UI feedback
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useWorkbenchPositioning } from "./useWorkbenchPositioning";
import { useWorkbenchDragState } from "./useWorkbenchDragState";

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
  // Initialize specialized hooks
  const { getNodeAtPosition, calculateFlowPosition } = useWorkbenchPositioning({
    nodes,
    reactFlowWrapper
  });

  const { clearDragOverStates, updateDragOverState } = useWorkbenchDragState({
    setNodes
  });

  /**
   * Handle document drops from library or module drops from palette
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
        const pos = calculateFlowPosition(event.clientX, event.clientY);
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
      const pos = calculateFlowPosition(event.clientX, event.clientY);
      
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
    [setNodes, getNodeAtPosition, clearDragOverStates, calculateFlowPosition]
  );

  /**
   * Provide visual feedback during drag operations
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    
    // Only handle visual feedback for document drags
    const docData = event.dataTransfer.types.includes("application/lovable-document");
    if (docData) {
      const targetNode = getNodeAtPosition(event.clientX, event.clientY);
      updateDragOverState(targetNode?.id);
    }
  }, [getNodeAtPosition, updateDragOverState]);

  /**
   * Clean up visual states when drag leaves workspace
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
