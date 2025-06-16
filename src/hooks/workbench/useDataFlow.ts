
/**
 * useDataFlow Hook
 * 
 * Purpose: Manages data flowing through the AI workbench pipeline
 * This hook simulates and tracks data as it flows between nodes,
 * generating mock data based on module types for preview purposes.
 * 
 * Key Responsibilities:
 * - Generate mock data based on node/module types
 * - Track data state for each edge connection
 * - Provide data transformation simulation
 * - Handle data flow updates when nodes change
 */

import { useState, useCallback, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { ModuleKind } from "@/data/modules";

interface DataFlowState {
  [edgeId: string]: {
    inputData: any;
    outputData: any;
    dataType: 'text' | 'json' | 'binary' | 'error';
    isProcessing: boolean;
  };
}

export const useDataFlow = (nodes: Node[], edges: Edge[]) => {
  const [dataFlowState, setDataFlowState] = useState<DataFlowState>({});

  /**
   * Generate mock data based on module type
   */
  const generateMockData = useCallback((moduleType: ModuleKind | 'document-input', isInput = false) => {
    if (moduleType === 'document-input') {
      return {
        type: 'document',
        content: 'Sample document content for processing...',
        metadata: { pages: 3, wordCount: 150 }
      };
    }

    switch (moduleType) {
      case 'text-extractor':
        return isInput 
          ? { type: 'document', content: 'PDF document content...' }
          : { extractedText: 'Extracted text from document...', confidence: 0.95 };
      
      case 'paragraph-splitter':
        return isInput
          ? { extractedText: 'Long text content...' }
          : { paragraphs: ['Paragraph 1...', 'Paragraph 2...'], count: 2 };
      
      case 'grammar-checker':
        return isInput
          ? { paragraphs: ['Text with errors...'] }
          : { corrections: [{ text: 'Corrected text...', suggestions: 2 }] };
      
      case 'citation-finder':
        return isInput
          ? { paragraphs: ['Text with citations...'] }
          : { citations: [{ text: 'Found citation...', source: 'Academic paper' }] };
      
      case 'citation-verifier':
        return isInput
          ? { citations: ['Citation to verify...'] }
          : { verified: [{ citation: 'Verified citation...', isValid: true }] };
      
      case 'style-guide-enforcer':
        return isInput
          ? { text: 'Text to check style...' }
          : { styleChecked: 'Style-corrected text...', violations: 1 };
      
      case 'custom':
        return isInput
          ? { input: 'Custom input data...' }
          : { output: 'Custom processed data...', customField: 'value' };
      
      default:
        return { data: 'Processed data...', timestamp: new Date().toISOString() };
    }
  }, []);

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

        const outputData = generateMockData(sourceModuleType, false);
        const inputData = generateMockData(targetModuleType, true);

        newDataFlowState[edge.id] = {
          inputData,
          outputData,
          dataType: typeof outputData === 'string' ? 'text' : 'json',
          isProcessing: false
        };
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
   * Simulate data processing
   */
  const simulateProcessing = useCallback((edgeId: string) => {
    setDataFlowState(prev => ({
      ...prev,
      [edgeId]: {
        ...prev[edgeId],
        isProcessing: true
      }
    }));

    // Simulate processing delay
    setTimeout(() => {
      setDataFlowState(prev => ({
        ...prev,
        [edgeId]: {
          ...prev[edgeId],
          isProcessing: false
        }
      }));
    }, 1000);
  }, []);

  return {
    dataFlowState,
    getEdgeData,
    simulateProcessing
  };
};
