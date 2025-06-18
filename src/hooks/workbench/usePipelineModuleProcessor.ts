
/**
 * usePipelineModuleProcessor Hook
 * 
 * Purpose: Processes individual modules within a pipeline workflow
 */

import { useCallback } from "react";
import { AllNodes } from "@/types/workbench";
import { processGrammarAnalysis } from "./utils/moduleProcessors/grammarAnalysisProcessor";
import { processParagraphBatches } from "./utils/paragraphBatchProcessor";
import { handleTextExtractor } from "./utils/textExtractorHandler";
import { useChatGPTApi } from "./useChatGPTApi";

export const usePipelineModuleProcessor = (nodes: AllNodes[]) => {
  const { callChatGPT } = useChatGPTApi();

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
        case 'grammar-checker': {
          // Enhanced batch processing with document extraction result
          const batchResults = await processParagraphBatches(
            inputData.paragraphs || [],
            async (paragraph: any, index: number) => {
              // Use the grammar analysis processor
              return await processGrammarAnalysis(
                { paragraphs: [paragraph] },
                callChatGPT
              );
            },
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
          
          // Combine results
          const allAnalysis = batchResults.flatMap(batch => batch.output?.analysis || []);
          result = {
            output: {
              analysis: allAnalysis,
              paragraphs: inputData.paragraphs || []
            },
            metadata: {
              processingTime: Date.now() - startTime,
              paragraphsProcessed: batchResults.length,
              totalSuggestions: allAnalysis.length
            }
          };
          
          console.log(`Grammar analysis completed for ${nodeId}:`, {
            paragraphsProcessed: batchResults.length,
            totalSuggestions: allAnalysis.length,
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
  }, [nodes, callChatGPT]);

  return {
    processModuleNode
  };
};
