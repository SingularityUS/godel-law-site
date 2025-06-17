
/**
 * useNodeEnhancement Hook
 * 
 * Purpose: Enhances nodes with execution status and other data
 */

import { useMemo } from "react";
import { AllNodes } from "@/types/workbench";

interface UseNodeEnhancementProps {
  nodes: AllNodes[];
  getNodeExecutionStatus: (nodeId: string) => any;
}

export const useNodeEnhancement = ({
  nodes,
  getNodeExecutionStatus
}: UseNodeEnhancementProps) => {
  
  /**
   * Enhance nodes with execution status indicators
   */
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: getNodeExecutionStatus(node.id)
      }
    }));
  }, [nodes, getNodeExecutionStatus]);

  return { enhancedNodes };
};
