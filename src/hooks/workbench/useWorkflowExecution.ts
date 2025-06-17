/**
 * useWorkflowExecution Hook
 * 
 * Purpose: Orchestrates the execution of the entire workflow pipeline
 * Handles sequential module processing with real ChatGPT integration
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { useChatGPTApi } from "./useChatGPTApi";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";

export interface WorkflowExecutionState {
  isRunning: boolean;
  currentModuleId: string | null;
  completedModules: Set<string>;
  moduleResults: Map<string, any>;
  finalOutput: any;
  error: string | null;
}

export interface ExecutionStep {
  nodeId: string;
  moduleType: ModuleKind;
  inputData: any;
  outputData: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: Date;
}

export const useWorkflowExecution = () => {
  const { callChatGPT } = useChatGPTApi();
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    isRunning: false,
    currentModuleId: null,
    completedModules: new Set(),
    moduleResults: new Map(),
    finalOutput: null,
    error: null
  });

  const [executionHistory, setExecutionHistory] = useState<ExecutionStep[]>([]);

  /**
   * Analyze workflow to determine execution order
   */
  const analyzeWorkflow = useCallback((nodes: Node[], edges: Edge[]) => {
    // Find document input nodes (starting points)
    const documentNodes = nodes.filter(node => 
      node.data?.moduleType === 'document-input'
    );

    // Build execution path from each document node
    const executionPaths: string[][] = [];
    
    documentNodes.forEach(docNode => {
      const path = buildExecutionPath(docNode.id, nodes, edges);
      if (path.length > 0) {
        executionPaths.push(path);
      }
    });

    return executionPaths;
  }, []);

  /**
   * Build execution path from a starting node
   */
  const buildExecutionPath = (startNodeId: string, nodes: Node[], edges: Edge[]): string[] => {
    const path: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    
    let currentNodeId = startNodeId;
    
    while (true) {
      // Find outgoing edges from current node
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      
      if (outgoingEdges.length === 0) break; // End of path
      
      // Take the first outgoing edge (for now, we'll handle multiple outputs later)
      const nextEdge = outgoingEdges[0];
      const nextNodeId = nextEdge.target;
      
      if (visited.has(nextNodeId)) break; // Prevent cycles
      
      path.push(nextNodeId);
      visited.add(nextNodeId);
      currentNodeId = nextNodeId;
    }
    
    return path;
  };

  /**
   * Process a single module with ChatGPT
   */
  const processModule = async (node: Node, inputData: any): Promise<any> => {
    const moduleType = node.data?.moduleType as ModuleKind;
    const customPrompt = node.data?.promptOverride;
    
    // Get module definition
    const moduleDef = MODULE_DEFINITIONS.find(m => m.type === moduleType);
    if (!moduleDef) {
      throw new Error(`Unknown module type: ${moduleType}`);
    }

    // Skip ChatGPT for document input nodes
    if (moduleType === 'document-input') {
      return inputData;
    }

    // Prepare prompt - ensure systemPrompt is a string
    const systemPrompt = (customPrompt || moduleDef.defaultPrompt || "Process this input:") as string;
    const userPrompt = typeof inputData === 'string' 
      ? inputData 
      : JSON.stringify(inputData);

    try {
      const result = await callChatGPT(userPrompt, systemPrompt);
      return result.response || result.error;
    } catch (error) {
      console.error(`Error processing module ${node.id}:`, error);
      throw error;
    }
  };

  /**
   * Execute the entire workflow
   */
  const executeWorkflow = useCallback(async (nodes: Node[], edges: Edge[]) => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: true,
      error: null,
      completedModules: new Set(),
      moduleResults: new Map(),
      finalOutput: null
    }));

    setExecutionHistory([]);

    try {
      const executionPaths = analyzeWorkflow(nodes, edges);
      
      if (executionPaths.length === 0) {
        throw new Error("No valid execution path found. Please ensure you have document input nodes connected to processing modules.");
      }

      // Execute the first path (we can extend this to handle multiple paths later)
      const mainPath = executionPaths[0];
      let currentData: any = null;

      for (let i = 0; i < mainPath.length; i++) {
        const nodeId = mainPath[i];
        const node = nodes.find(n => n.id === nodeId);
        
        if (!node) continue;

        setExecutionState(prev => ({
          ...prev,
          currentModuleId: nodeId
        }));

        const step: ExecutionStep = {
          nodeId,
          moduleType: node.data?.moduleType as ModuleKind,
          inputData: currentData,
          outputData: null,
          status: 'processing',
          timestamp: new Date()
        };

        setExecutionHistory(prev => [...prev, step]);

        try {
          // For document input, get the uploaded file data
          if (node.data?.moduleType === 'document-input') {
            currentData = node.data?.extractedText || node.data?.content || "Document content";
          } else {
            currentData = await processModule(node, currentData);
          }

          // Update step with results
          step.outputData = currentData;
          step.status = 'completed';
          
          setExecutionHistory(prev => 
            prev.map(s => s.nodeId === nodeId ? step : s)
          );

          setExecutionState(prev => ({
            ...prev,
            completedModules: new Set([...prev.completedModules, nodeId]),
            moduleResults: new Map([...prev.moduleResults, [nodeId, currentData]])
          }));

        } catch (error) {
          step.status = 'error';
          setExecutionHistory(prev => 
            prev.map(s => s.nodeId === nodeId ? step : s)
          );
          throw error;
        }
      }

      // Set final output
      setExecutionState(prev => ({
        ...prev,
        finalOutput: currentData,
        currentModuleId: null,
        isRunning: false
      }));

    } catch (error: any) {
      setExecutionState(prev => ({
        ...prev,
        error: error.message,
        isRunning: false,
        currentModuleId: null
      }));
    }
  }, [analyzeWorkflow, callChatGPT]);

  /**
   * Reset execution state
   */
  const resetExecution = useCallback(() => {
    setExecutionState({
      isRunning: false,
      currentModuleId: null,
      completedModules: new Set(),
      moduleResults: new Map(),
      finalOutput: null,
      error: null
    });
    setExecutionHistory([]);
  }, []);

  return {
    executionState,
    executionHistory,
    executeWorkflow,
    resetExecution
  };
};
