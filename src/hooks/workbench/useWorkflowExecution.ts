
/**
 * useWorkflowExecution Hook
 * 
 * Purpose: Orchestrates sequential execution of workbench modules
 * Handles topological sorting, data flow, and execution state management
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { useChatGPTApi } from "./useChatGPTApi";
import { useMockDataGenerator } from "./useMockDataGenerator";
import { ModuleKind } from "@/data/modules";

interface ExecutionState {
  isExecuting: boolean;
  currentStep: number;
  totalSteps: number;
  executionOrder: string[];
  results: Record<string, any>;
  finalResult: any;
  error: string | null;
}

export const useWorkflowExecution = (nodes: Node[], edges: Edge[]) => {
  const { callChatGPT } = useChatGPTApi();
  const { generateMockData } = useMockDataGenerator();

  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    currentStep: 0,
    totalSteps: 0,
    executionOrder: [],
    results: {},
    finalResult: null,
    error: null
  });

  /**
   * Calculate execution order using topological sort
   */
  const calculateExecutionOrder = useCallback(() => {
    // Find document input nodes (starting points)
    const documentNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    if (documentNodes.length === 0) {
      throw new Error('No document input nodes found. Please add a document to start the workflow.');
    }

    // Build adjacency list from edges
    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    // Initialize
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
      inDegree[node.id] = 0;
    });

    // Build graph
    edges.forEach(edge => {
      adjacencyList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });

    // Topological sort using Kahn's algorithm
    const queue = Object.keys(inDegree).filter(nodeId => inDegree[nodeId] === 0);
    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      executionOrder.push(current);

      adjacencyList[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (executionOrder.length !== nodes.length) {
      throw new Error('Workflow contains cycles. Please check your connections.');
    }

    return executionOrder;
  }, [nodes, edges]);

  /**
   * Execute a single module
   */
  const executeModule = useCallback(async (nodeId: string, inputData: any) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const moduleType = typeof node.data?.moduleType === 'string' ? node.data.moduleType : 'default';
    const customPrompt = typeof node.data?.promptOverride === 'string' ? node.data.promptOverride : undefined;

    // Handle document input nodes
    if (moduleType === 'document-input') {
      return node.data?.extractedText || node.data?.content || 'Sample document content';
    }

    // Handle ChatGPT-enabled modules
    if (moduleType === 'chatgpt-assistant' || node.data?.supportsChatGPT) {
      try {
        const systemPrompt = customPrompt || `You are processing data through a ${moduleType} module. Process the input data accordingly.`;
        const result = await callChatGPT(
          `Process this data: ${JSON.stringify(inputData)}`,
          systemPrompt
        );
        return result.response || result.error || 'Processing completed';
      } catch (error) {
        console.error(`ChatGPT processing failed for ${nodeId}:`, error);
        return `Error processing with ChatGPT: ${error}`;
      }
    }

    // For other modules, use enhanced mock data generation
    const validModuleType = isValidModuleKind(moduleType) ? moduleType : 'text-extractor';
    return await generateMockData(validModuleType, false, true, customPrompt);
  }, [nodes, callChatGPT, generateMockData]);

  /**
   * Type guard to check if a string is a valid ModuleKind
   */
  const isValidModuleKind = (type: string): type is ModuleKind => {
    const validTypes: ModuleKind[] = [
      'text-extractor', 'data-processor', 'chatgpt-assistant', 
      'sentiment-analyzer', 'summarizer', 'translator'
    ];
    return validTypes.includes(type as ModuleKind);
  };

  /**
   * Execute the entire workflow
   */
  const executeWorkflow = useCallback(async () => {
    try {
      const executionOrder = calculateExecutionOrder();
      
      setExecutionState({
        isExecuting: true,
        currentStep: 0,
        totalSteps: executionOrder.length,
        executionOrder,
        results: {},
        finalResult: null,
        error: null
      });

      const results: Record<string, any> = {};
      let currentData: any = null;

      // Execute modules in order
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        
        setExecutionState(prev => ({
          ...prev,
          currentStep: i + 1
        }));

        // Get input data from previous step or use initial data
        const inputData = i === 0 ? null : currentData;
        
        // Execute the module
        const result = await executeModule(nodeId, inputData);
        results[nodeId] = result;
        currentData = result;

        // Add delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Execution completed successfully
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        results,
        finalResult: currentData
      }));

      return currentData;

    } catch (error: any) {
      console.error('Workflow execution failed:', error);
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        error: error.message || 'Execution failed'
      }));
      throw error;
    }
  }, [calculateExecutionOrder, executeModule]);

  /**
   * Reset execution state
   */
  const resetExecution = useCallback(() => {
    setExecutionState({
      isExecuting: false,
      currentStep: 0,
      totalSteps: 0,
      executionOrder: [],
      results: {},
      finalResult: null,
      error: null
    });
  }, []);

  /**
   * Check if workflow is valid for execution
   */
  const isWorkflowValid = useCallback(() => {
    try {
      calculateExecutionOrder();
      return true;
    } catch {
      return false;
    }
  }, [calculateExecutionOrder]);

  return {
    executionState,
    executeWorkflow,
    resetExecution,
    isWorkflowValid
  };
};
