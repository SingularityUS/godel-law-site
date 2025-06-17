
/**
 * usePipelineExecution Hook
 * 
 * Purpose: Orchestrates sequential execution of AI modules in the workbench
 * This hook handles the pipeline execution flow, starting from document inputs
 * and processing through connected modules using ChatGPT API calls.
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { AllNodes, DocumentInputNode, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "./useChatGPTApi";

interface ExecutionState {
  [nodeId: string]: {
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
    data?: any;
    error?: string;
  };
}

export const usePipelineExecution = (nodes: AllNodes[], edges: Edge[]) => {
  const [executionState, setExecutionState] = useState<ExecutionState>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const { callChatGPT } = useChatGPTApi();

  /**
   * Find all document input nodes (pipeline starting points)
   */
  const getDocumentInputNodes = useCallback((): DocumentInputNode[] => {
    return nodes.filter(node => node.data?.moduleType === 'document-input') as DocumentInputNode[];
  }, [nodes]);

  /**
   * Get connected nodes in execution order using breadth-first traversal
   */
  const getExecutionOrder = useCallback((startNodeId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startNodeId];
    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;

      visited.add(currentNodeId);
      executionOrder.push(currentNodeId);

      // Find connected nodes (targets of edges from current node)
      const connectedEdges = edges.filter(edge => edge.source === currentNodeId);
      const nextNodes = connectedEdges.map(edge => edge.target);
      
      nextNodes.forEach(nodeId => {
        if (!visited.has(nodeId)) {
          queue.push(nodeId);
        }
      });
    }

    return executionOrder;
  }, [edges]);

  /**
   * Extract text content from document input
   */
  const extractDocumentText = useCallback(async (docNode: DocumentInputNode): Promise<string> => {
    if (!docNode.data?.file) {
      throw new Error('No file attached to document node');
    }

    const file = docNode.data.file;
    
    // For text files, read directly
    if (file.type?.startsWith('text/')) {
      return await file.text();
    }
    
    // For other file types, return the file name and basic info as placeholder
    // In a real implementation, you'd use proper text extraction libraries
    return `Document: ${docNode.data.documentName}\nFile type: ${file.type}\nSize: ${file.size} bytes`;
  }, []);

  /**
   * Process a single node with ChatGPT
   */
  const processNode = useCallback(async (nodeId: string, inputData: string): Promise<string> => {
    const node = nodes.find(n => n.id === nodeId) as HelperNode;
    if (!node || node.data?.moduleType === 'document-input') {
      return inputData; // Skip document input nodes
    }

    const moduleType = node.data.moduleType as ModuleKind;
    const moduleDef = MODULE_DEFINITIONS.find(m => m.type === moduleType);
    
    if (!moduleDef?.supportsChatGPT) {
      console.warn(`Module ${moduleType} does not support ChatGPT processing`);
      return inputData; // Pass through unchanged
    }

    // Use custom prompt if available, otherwise use default
    const systemPrompt = node.data.promptOverride || moduleDef.defaultPrompt;
    
    console.log(`Processing node ${nodeId} (${moduleType}) with ChatGPT`);
    
    const result = await callChatGPT(inputData, systemPrompt);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.response || inputData;
  }, [nodes, callChatGPT]);

  /**
   * Execute pipeline starting from a document input node
   */
  const executePipeline = useCallback(async (startNodeId: string) => {
    if (isExecuting) return;

    setIsExecuting(true);
    setFinalOutput(null);
    
    try {
      const executionOrder = getExecutionOrder(startNodeId);
      console.log('Execution order:', executionOrder);

      // Initialize execution state
      const newExecutionState: ExecutionState = {};
      executionOrder.forEach(nodeId => {
        newExecutionState[nodeId] = { status: 'queued' };
      });
      setExecutionState(newExecutionState);

      let currentData: string = '';

      // Process each node in order
      for (const nodeId of executionOrder) {
        // Update status to processing
        setExecutionState(prev => ({
          ...prev,
          [nodeId]: { ...prev[nodeId], status: 'processing' }
        }));

        try {
          const node = nodes.find(n => n.id === nodeId);
          
          if (node?.data?.moduleType === 'document-input') {
            // Extract text from document
            currentData = await extractDocumentText(node as DocumentInputNode);
          } else {
            // Process with ChatGPT
            currentData = await processNode(nodeId, currentData);
          }

          // Update status to completed with data
          setExecutionState(prev => ({
            ...prev,
            [nodeId]: { 
              status: 'completed', 
              data: currentData 
            }
          }));

        } catch (error: any) {
          // Update status to error
          setExecutionState(prev => ({
            ...prev,
            [nodeId]: { 
              status: 'error', 
              error: error.message 
            }
          }));
          throw error; // Stop execution on error
        }
      }

      // Set final output
      setFinalOutput(currentData);
      console.log('Pipeline execution completed successfully');

    } catch (error: any) {
      console.error('Pipeline execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, getExecutionOrder, extractDocumentText, processNode, nodes]);

  /**
   * Execute all pipelines (from all document input nodes)
   */
  const executeAllPipelines = useCallback(async () => {
    const docInputNodes = getDocumentInputNodes();
    
    if (docInputNodes.length === 0) {
      console.warn('No document input nodes found');
      return;
    }

    // For now, execute the first pipeline found
    // In the future, we could execute multiple pipelines in parallel
    await executePipeline(docInputNodes[0].id);
  }, [getDocumentInputNodes, executePipeline]);

  /**
   * Get execution status for a specific node
   */
  const getNodeExecutionStatus = useCallback((nodeId: string) => {
    return executionState[nodeId] || { status: 'idle' };
  }, [executionState]);

  /**
   * Reset execution state
   */
  const resetExecution = useCallback(() => {
    setExecutionState({});
    setFinalOutput(null);
    setIsExecuting(false);
  }, []);

  return {
    executionState,
    isExecuting,
    finalOutput,
    executeAllPipelines,
    executePipeline,
    getNodeExecutionStatus,
    resetExecution,
    getDocumentInputNodes,
    getExecutionOrder
  };
};
