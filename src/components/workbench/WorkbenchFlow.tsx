/**
 * WorkbenchFlow Component
 * 
 * Purpose: Core React Flow implementation for the AI Workbench
 * Refactored to use orchestration hooks for better organization
 */

import React, { forwardRef, useCallback, useImperativeHandle } from "react";
import { ReactFlow } from "@xyflow/react";
import { useWorkbenchEvents } from "@/hooks/useWorkbenchEvents";
import { useWorkbenchOrchestration } from "@/hooks/workbench/orchestration/useWorkbenchOrchestration";
import { useNodeEnhancement } from "@/hooks/workbench/orchestration/useNodeEnhancement";
import { useEdgeEnhancement } from "@/hooks/workbench/orchestration/useEdgeEnhancement";
import { useWorkbenchPositioning } from "@/hooks/workbench/useWorkbenchPositioning";
import WorkbenchControls from "./WorkbenchControls";
import {
  initialNodes,
  initialEdges,
  nodeTypes,
  edgeTypes,
  defaultEdgeOptions,
  flowOptions,
  AllNodes
} from "./flow/FlowConfiguration";

import "@xyflow/react/dist/style.css";
import "./dataPreview.css";

interface WorkbenchFlowProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  onOpenSidebar: () => void;
}

const WorkbenchFlow = forwardRef<any, WorkbenchFlowProps>(function WorkbenchFlow(
  { onModuleEdit, editingPromptNodeId, uploadedFiles, reactFlowWrapper, onOpenSidebar },
  ref
) {
  // Initialize workbench event handling
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onDrop,
    onDragOver,
    onDragLeave,
    onConnect
  } = useWorkbenchEvents({
    initialNodes,
    initialEdges,
    reactFlowWrapper
  });

  // Initialize positioning helper
  const { getNextDocumentPosition } = useWorkbenchPositioning({
    nodes,
    reactFlowWrapper
  });

  // Initialize orchestration
  const {
    getEdgeData,
    simulateProcessing,
    toggleEdgePreview,
    hideAllPreviews,
    isEdgeSelected,
    handleClosePreview,
    isExecuting,
    finalOutput,
    executeAllPipelines,
    resetExecution,
    getNodeExecutionStatus,
    getNodeColor,
    handlePaneClick
  } = useWorkbenchOrchestration({
    nodes,
    edges,
    setNodes,
    onModuleEdit,
    ref
  });

  // Check if a document with the same name already exists
  const documentExists = useCallback((documentName: string) => {
    // Allow multiple documents with the same name by checking for exact duplicates
    // This prevents true duplicates while allowing legitimate multiple additions
    return nodes.some(node => 
      node.type === "document-input" && 
      node.data?.documentName === documentName &&
      node.data?.file?.size && // Only consider it a duplicate if it has the same size
      node.data?.file?.uploaded_at // and same upload timestamp
    );
  }, [nodes]);

  // Generate a unique document name to prevent conflicts
  const generateUniqueDocumentName = useCallback((originalName: string, fileData: any) => {
    const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
    const extension = originalName.match(/\.[^/.]+$/)?.[0] || "";
    const timestamp = Date.now();
    
    // Check if we need to make it unique
    const existingNames = nodes
      .filter(node => node.type === "document-input")
      .map(node => node.data?.documentName)
      .filter(Boolean);
    
    if (!existingNames.includes(originalName)) {
      return originalName;
    }
    
    // If the name exists, add a timestamp to make it unique
    return `${baseName}_${timestamp}${extension}`;
  }, [nodes]);

  // Method to add a single document node
  const addDocumentNode = useCallback((file: any) => {
    console.log('📄 [WORKBENCH-FLOW] Adding single document node:', file.name);
    
    // Check for duplicates and generate unique name if needed
    if (documentExists(file.name)) {
      console.log('⚠️ [WORKBENCH-FLOW] Document already exists, creating unique copy:', file.name);
      const uniqueName = generateUniqueDocumentName(file.name, file);
      file.name = uniqueName;
      console.log('🔄 [WORKBENCH-FLOW] Using unique name:', uniqueName);
    }
    
    const pos = getNextDocumentPosition();
    const nodeId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNode = {
      id: nodeId,
      type: "document-input",
      position: pos,
      data: { 
        moduleType: "document-input" as const, 
        documentName: file.name, 
        file: file 
      },
      draggable: true,
    };
    
    console.log('➕ [WORKBENCH-FLOW] Creating document node at position:', pos);
    setNodes((nds) => [...nds, newNode]);
    
    // Dispatch anchor events for the new document
    console.log('🚀 [WORKBENCH-FLOW] Dispatching anchor events for:', file.name);
    const anchoringStartEvent = new CustomEvent('anchoringStarted', {
      detail: {
        documentName: file.name,
        source: 'auto-upload'
      }
    });
    window.dispatchEvent(anchoringStartEvent);
    
    // Check if we have valid anchor data
    const hasValidAnchorData = file.anchoredText && 
                              file.anchorCount > 0 && 
                              /⟦P-\d{5}⟧/.test(file.anchoredText);
    
    if (hasValidAnchorData) {
      const completionEvent = new CustomEvent('anchorTokensComplete', {
        detail: {
          documentName: file.name,
          documentText: file.extractedText || '',
          anchoredText: file.anchoredText,
          anchorCount: file.anchorCount,
          source: 'auto-upload'
        }
      });
      window.dispatchEvent(completionEvent);
    }
  }, [nodes, documentExists, generateUniqueDocumentName, getNextDocumentPosition, setNodes]);

  // Method to add multiple document nodes
  const addDocumentNodes = useCallback((files: any[]) => {
    console.log('📄 [WORKBENCH-FLOW] Adding multiple document nodes:', files.length);
    
    const newNodes: any[] = [];
    let addedCount = 0;
    
    files.forEach((file) => {
      // Check for duplicates and generate unique name if needed
      if (documentExists(file.name)) {
        console.log('⚠️ [WORKBENCH-FLOW] Document already exists, creating unique copy:', file.name);
        const uniqueName = generateUniqueDocumentName(file.name, file);
        file.name = uniqueName;
        console.log('🔄 [WORKBENCH-FLOW] Using unique name:', uniqueName);
      }
      
      // Calculate position for this document (account for existing + new nodes)
      const documentNodes = nodes.filter(node => node.type === "document-input");
      const totalDocuments = documentNodes.length + addedCount;
      
      const startX = 80;
      const startY = 100;
      const nodeWidth = 140;
      const nodeHeight = 100;
      const maxNodesPerRow = 4;
      
      const row = Math.floor(totalDocuments / maxNodesPerRow);
      const col = totalDocuments % maxNodesPerRow;
      
      const pos = {
        x: startX + (col * nodeWidth),
        y: startY + (row * nodeHeight)
      };
      
      const nodeId = `doc-${Date.now()}-${addedCount}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newNode = {
        id: nodeId,
        type: "document-input",
        position: pos,
        data: { 
          moduleType: "document-input" as const, 
          documentName: file.name, 
          file: file 
        },
        draggable: true,
      };
      
      newNodes.push(newNode);
      addedCount++;
      
      console.log('➕ [WORKBENCH-FLOW] Prepared document node:', file.name, 'at position:', pos);
    });
    
    if (newNodes.length > 0) {
      console.log('🚀 [WORKBENCH-FLOW] Adding', newNodes.length, 'new document nodes to workbench');
      setNodes((nds) => [...nds, ...newNodes]);
      
      // Dispatch events for each new document
      newNodes.forEach((node) => {
        const file = node.data.file;
        
        const anchoringStartEvent = new CustomEvent('anchoringStarted', {
          detail: {
            documentName: file.name,
            source: 'bulk-auto-upload'
          }
        });
        window.dispatchEvent(anchoringStartEvent);
        
        const hasValidAnchorData = file.anchoredText && 
                                  file.anchorCount > 0 && 
                                  /⟦P-\d{5}⟧/.test(file.anchoredText);
        
        if (hasValidAnchorData) {
          const completionEvent = new CustomEvent('anchorTokensComplete', {
            detail: {
              documentName: file.name,
              documentText: file.extractedText || '',
              anchoredText: file.anchoredText,
              anchorCount: file.anchorCount,
              source: 'bulk-auto-upload'
            }
          });
          window.dispatchEvent(completionEvent);
        }
      });
    }
  }, [nodes, documentExists, generateUniqueDocumentName, setNodes]);

  // Expose methods through the ref
  useImperativeHandle(ref, () => ({
    addDocumentNode,
    addDocumentNodes
  }), [addDocumentNode, addDocumentNodes]);

  // Emit pipeline completion events when finalOutput changes
  React.useEffect(() => {
    if (finalOutput) {
      console.log('Emitting pipeline completion event with output:', finalOutput);
      const event = new CustomEvent('pipelineCompleted', {
        detail: finalOutput
      });
      window.dispatchEvent(event);
    }
  }, [finalOutput]);

  // Enhance nodes with execution status
  const { enhancedNodes } = useNodeEnhancement({
    nodes,
    getNodeExecutionStatus
  });

  // Enhance edges with data preview functionality
  const { enhancedEdges } = useEdgeEnhancement({
    edges,
    getEdgeData,
    simulateProcessing,
    isEdgeSelected,
    toggleEdgePreview,
    handleClosePreview
  });

  /**
   * Handles node clicks for both editing and preview functionality
   */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: AllNodes) => {
      if (node.type === "document-input") {
        // Handle document nodes for preview
        const docNode = node as any;
        if (docNode.data?.file) {
          // Trigger modal preview (existing behavior)
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

          // Also trigger sidebar preview
          const sidebarPreviewEvent = new CustomEvent('showDocumentInSidebar', {
            detail: {
              name: docNode.data.documentName,
              type: docNode.data.file.type,
              preview: docNode.data.file.preview
            }
          });
          window.dispatchEvent(sidebarPreviewEvent);
        }
      }
    },
    []
  );

  /**
   * Enhanced node click handler that also hides data previews
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      hideAllPreviews();
      onNodeClick(event, node);
    },
    [onNodeClick, hideAllPreviews]
  );

  return (
    <ReactFlow
      nodes={enhancedNodes}
      edges={enhancedEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      {...flowOptions}
    >
      <WorkbenchControls 
        getNodeColor={getNodeColor}
        nodes={nodes}
        edges={edges}
        isExecuting={isExecuting}
        onExecutePipeline={executeAllPipelines}
        onStopPipeline={resetExecution}
        onOpenSidebar={onOpenSidebar}
      />
    </ReactFlow>
  );
});

export default WorkbenchFlow;
