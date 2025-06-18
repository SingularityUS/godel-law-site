/**
 * usePipelineModuleProcessor Hook
 * 
 * Purpose: Processes individual modules within a pipeline workflow
 */

import { useCallback } from "react";
import { AllNodes } from "@/types/workbench";
import { createGrammarAnalysisProcessor } from "./utils/grammarAnalysisProcessor";
import { processParagraphBatches } from "./utils/paragraphBatchProcessor";
import { combineGrammarResults } from "./utils/combineResults";
import { handleTextExtractor } from "./utils/textExtractorHandler";

export const usePipelineModuleProcessor = (nodes: AllNodes[]) => {
  /**
   * Process module node
   */
  const processModuleNode = useCallback(async (
    nodeId: string,
    inputData: any,
    updateProgress: (nodeId: string, progress: { completed: number; total: number; label?: string }) => void,
    updateNodeStatus: (nodeId: string, status: any) => void,
    clearProgress: (nodeId: string) => void,
    documentExtractionResult?: any
  ) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const startTime = Date.now();
    console.log(`Processing module node: ${nodeId} (${node.data?.moduleType}) with document context:`, {
      hasDocumentExtraction: !!documentExtractionResult,
      fileName: documentExtractionResult?.fileName,
      contentLength: documentExtractionResult?.originalContent?.length || 0
    });

    try {
      let result;
      
      switch (node.data?.moduleType) {
        case 'grammar-analysis': {
          const { processingFunction } = await createGrammarAnalysisProcessor(node, inputData, updateProgress, clearProgress);
          
          // Enhanced batch processing with document extraction result
          const batchResults = await processParagraphBatches(
            inputData.paragraphs || [],
            processingFunction,
            {},
            (completed, total, outputGenerated) => {
              updateProgress(nodeId, { 
                completed, 
                total, 
                label: `Processing paragraphs: ${completed}/${total} (${outputGenerated || 0} suggestions generated)` 
              });
            },
            documentExtractionResult
          );
          
          result = combineGrammarResults(batchResults, inputData, Date.now() - startTime);
          console.log(`Grammar analysis completed for ${nodeId}:`, {
            paragraphsProcessed: batchResults.length,
            totalSuggestions: result.output?.analysis?.length || 0,
            processingTime: result.metadata?.processingTime
          });
          break;
        }

        case 'text-extractor': {
          result = handleTextExtractor(nodeId, inputData, startTime);
          break;
        }

        default:
          throw new Error(`Unknown module type: ${node.data?.moduleType}`);
      }

      return result;
    } catch (error: any) {
      console.error(`Error in module processor for ${nodeId}:`, error);
      throw error;
    }
  }, [nodes, createGrammarAnalysisProcessor, combineGrammarResults]);

  return {
    processModuleNode
  };
};
