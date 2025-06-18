
/**
 * useWorkbenchDropHandling Hook
 * 
 * Purpose: Handles document and module drop operations for the workbench
 * Extracted from useWorkbenchDragDrop for better separation of concerns
 * 
 * Key Responsibilities:
 * - Processes document drops from library
 * - Handles module drops from palette
 * - Manages node creation and updates
 * - Coordinates with positioning system
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useWorkbenchPositioning } from "./useWorkbenchPositioning";

type AllNodes = Node<any>;

interface UseWorkbenchDropHandlingProps {
  nodes: AllNodes[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  clearDragOverStates: () => void;
}

export const useWorkbenchDropHandling = ({
  nodes,
  setNodes,
  reactFlowWrapper,
  clearDragOverStates
}: UseWorkbenchDropHandlingProps) => {
  const { getNodeAtPosition, calculateFlowPosition } = useWorkbenchPositioning({
    nodes,
    reactFlowWrapper
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

  return {
    onDrop
  };
};
