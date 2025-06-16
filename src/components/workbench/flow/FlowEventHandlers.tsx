
/**
 * Flow Event Handlers Module
 * 
 * Purpose: Centralized event handling logic for React Flow interactions
 * This module contains all the event handlers and side effects needed for
 * proper React Flow operation including node clicks and custom events.
 * 
 * Key Responsibilities:
 * - Handles node click events for document preview
 * - Manages custom event listeners for node settings
 * - Provides imperative API for external document addition
 * - Coordinates event handling with React lifecycle
 * 
 * Integration Points:
 * - Uses React hooks for event listener management
 * - Coordinates with DocumentInputNode for preview events
 * - Integrates with parent callbacks for module editing
 * - Manages communication with external components
 * 
 * Event Flow:
 * 1. Node clicks trigger document preview or editing
 * 2. Custom events bubble up from child components
 * 3. External API calls add nodes programmatically
 * 4. All events maintain state consistency
 */

import { useEffect, useCallback, useImperativeHandle } from "react";
import { Node } from "@xyflow/react";
import { DocumentInputNode, HelperNode } from "../flow/FlowConfiguration";

interface FlowEventHandlersProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  onModuleEdit: (nodeId: string, node: HelperNode) => void;
  ref: React.Ref<any>;
}

export const useFlowEventHandlers = ({
  nodes,
  setNodes,
  onModuleEdit,
  ref
}: FlowEventHandlersProps) => {

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

  return {
    onNodeClick
  };
};
