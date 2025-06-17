
/**
 * useDataFlowState Hook
 * 
 * Purpose: Manages data flow state between nodes and edges
 * Handles data flow tracking and processing simulation
 */

import { useState, useCallback, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { ModuleKind } from "@/data/modules";
import { useMockDataGenerator } from "./useMockDataGenerator";

interface DataFlowState {
  [edgeId: string]: {
    inputData: any;
    outputData: any;
    dataType: 'text' | 'json' | 'binary' | 'error';
    isProcessing: boolean;
  };
}

export const useDataFlowState = (nodes: Node[], edges: Edge[]) => {
  const [dataFlowState, setDataFlowState] = useState<DataFlowState>({});
  const { generateMockData } = useMockDataGenerator();

  /**
   * Update data flow when edges or nodes change
   */
  useEffect(() => {
    const newDataFlowState: DataFlowState = {};

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourceModuleType = sourceNode.data?.moduleType as ModuleKind | 'document-input';
        const targetModuleType = targetNode.data?.moduleType as ModuleKind | 'document-input';

        // For now, use mock data. Real ChatGPT integration will be triggered on demand
        const outputData = generateMockData(sourceModuleType, false, false);
        const inputData = generateMockData(targetModuleType, true, false);

        // Handle promises from async generateMockData
        Promise.all([outputData, inputData]).then(([output, input]) => {
          newDataFlowState[edge.id] = {
            inputData: input,
            outputData: output,
            dataType: typeof output === 'string' ? 'text' : 'json',
            isProcessing: false
          };
        });
      }
    });

    setDataFlowState(newDataFlowState);
  }, [nodes, edges, generateMockData]);

  /**
   * Get data for a specific edge
   */
  const getEdgeData = useCallback((edgeId: string) => {
    return dataFlowState[edgeId] || null;
  }, [dataFlowState]);

  /**
   * Simulate data processing with real ChatGPT integration
   */
  const simulateProcessing = useCallback(async (edgeId: string) => {
    const edgeData = dataFlowState[edgeId];
    if (!edgeData) return;

    setDataFlowState(prev => ({
      ...prev,
      [edgeId]: {
        ...prev[edgeId],
        isProcessing: true
      }
    }));

    // Find the target node to determine if it should use ChatGPT
    const edge = edges.find(e => e.id === edgeId);
    const targetNode = edge ? nodes.find(n => n.id === edge.target) : null;
    const moduleType = targetNode?.data?.moduleType as ModuleKind;
    const customPrompt = targetNode?.data?.promptOverride;

    // Simulate processing delay
    setTimeout(async () => {
      let enhancedOutput = edgeData.outputData;

      // Use real ChatGPT for supported modules
      if (moduleType === 'chatgpt-assistant' || (targetNode?.data?.supportsChatGPT && Math.random() > 0.5)) {
        try {
          // Ensure customPrompt is properly typed as string or undefined
          const promptOverride = typeof customPrompt === 'string' ? customPrompt : undefined;
          enhancedOutput = await generateMockData(moduleType, false, true, promptOverride);
        } catch (error) {
          console.error('ChatGPT processing failed:', error);
        }
      }

      setDataFlowState(prev => ({
        ...prev,
        [edgeId]: {
          ...prev[edgeId],
          outputData: enhancedOutput,
          isProcessing: false
        }
      }));
    }, 2000);
  }, [dataFlowState, edges, nodes, generateMockData]);

  return {
    dataFlowState,
    getEdgeData,
    simulateProcessing
  };
};
