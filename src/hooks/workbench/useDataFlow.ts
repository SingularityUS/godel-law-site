
/**
 * useDataFlow Hook
 * 
 * Purpose: Manages data flowing through the AI workbench pipeline
 * This hook coordinates data flow state management and ChatGPT integration
 * in a clean, maintainable way through focused sub-hooks.
 */

import { Node, Edge } from "@xyflow/react";
import { useDataFlowState } from "./useDataFlowState";
import { useChatGPTApi } from "./useChatGPTApi";

export const useDataFlow = (nodes: Node[], edges: Edge[]) => {
  // Use focused hooks for specific responsibilities
  const { dataFlowState, getEdgeData, simulateProcessing } = useDataFlowState(nodes, edges);
  const { callChatGPT } = useChatGPTApi();

  return {
    dataFlowState,
    getEdgeData,
    simulateProcessing,
    callChatGPT
  };
};
