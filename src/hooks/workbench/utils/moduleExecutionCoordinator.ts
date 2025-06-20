/**
 * Module Execution Coordinator
 * 
 * Purpose: Coordinates execution of different module types with their specific processors
 */

import { HelperNode } from "@/types/workbench";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { ModuleProgress } from "./moduleProgress";

// Import all processors
import { processParagraphSplitter } from "./moduleProcessors/paragraphSplitterProcessor";
import { processGrammarAnalysis } from "./moduleProcessors/grammarAnalysisProcessor";
import { processCitationFinder } from "./moduleProcessors/citationFinderProcessor";
import { processCitationVerifier } from "./moduleProcessors/citationVerifierProcessor";

export const createModuleExecutionCoordinator = (
  callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']
) => {
  return async (
    node: HelperNode,
    inputData: any,
    moduleType: ModuleKind,
    moduleDef: any,
    systemPrompt: string,
    onProgress?: (progress: ModuleProgress) => void
  ) => {
    console.log(`=== MODULE EXECUTION COORDINATOR: ${moduleType} ===`);
    console.log('Module configuration:', {
      supportsChatGPT: moduleDef.supportsChatGPT,
      outputFormat: moduleDef.outputFormat,
      hasInputData: !!inputData
    });

    // Create progress callback wrapper
    const progressCallback = onProgress ? (completed: number, total: number) => {
      onProgress({
        completed,
        total,
        moduleType,
        inputType: 'documents',
        outputGenerated: completed
      });
    } : undefined;

    // Route to appropriate processor based on module type
    switch (moduleType) {
      case 'paragraph-splitter':
        console.log('🔄 Routing to paragraph splitter processor');
        return await processParagraphSplitter(inputData);

      case 'grammar-checker':
        console.log('🔄 Routing to grammar analysis processor');
        return await processGrammarAnalysis(inputData, callChatGPT, progressCallback);

      case 'citation-finder':
        console.log('🔄 Routing to citation finder processor');
        return await processCitationFinder(inputData, callChatGPT, progressCallback);

      case 'citation-verifier':
        console.log('🔄 Routing to citation verifier processor');
        return await processCitationVerifier(inputData, callChatGPT, progressCallback);

      case 'text-extractor':
        console.log('🔄 Text extractor - pass through mode');
        // Text extractor is now a pass-through module
        return {
          output: inputData,
          metadata: {
            processingTime: Date.now(),
            method: 'text-extractor-passthrough',
            passThrough: true
          }
        };

      case 'document-input':
        console.log('🔄 Document input - pass through mode');
        // Document input is always pass-through
        return {
          output: inputData,
          metadata: {
            processingTime: Date.now(),
            method: 'document-input-passthrough',
            passThrough: true
          }
        };

      case 'chatgpt-assistant':
      case 'style-guide-enforcer':
      case 'custom':
        console.log(`🔄 Generic ChatGPT processing for ${moduleType}`);
        // For other modules that use ChatGPT, use generic processing
        if (moduleDef.supportsChatGPT) {
          try {
            // Fix: Use correct function signature - callChatGPT(prompt, systemPrompt, model, maxTokens)
            const response = await callChatGPT(systemPrompt, '', 'gpt-4o-mini', 2000);
            
            let responseText: string;
            if (typeof response === 'string') {
              responseText = response;
            } else if (response && typeof response === 'object' && response.response) {
              responseText = response.response;
            } else if (response && typeof response === 'object' && response.data) {
              responseText = response.data;
            } else {
              throw new Error('Invalid response format from ChatGPT');
            }

            // Try to parse as JSON if outputFormat is json
            let output = responseText;
            if (moduleDef.outputFormat === 'json') {
              try {
                output = JSON.parse(responseText);
              } catch (parseError) {
                console.warn(`Failed to parse JSON response for ${moduleType}, using raw text`);
              }
            }

            return {
              output,
              metadata: {
                processingTime: Date.now(),
                method: `${moduleType}-chatgpt`,
                outputFormat: moduleDef.outputFormat,
                rawResponse: responseText
              }
            };
          } catch (error) {
            console.error(`Error processing ${moduleType}:`, error);
            return {
              output: null,
              metadata: {
                processingTime: Date.now(),
                method: `${moduleType}-error`,
                error: error.message || 'Processing failed'
              }
            };
          }
        } else {
          console.warn(`Module ${moduleType} does not support ChatGPT processing`);
          return {
            output: inputData,
            metadata: {
              processingTime: Date.now(),
              method: `${moduleType}-passthrough`,
              passThrough: true,
              reason: 'No ChatGPT support configured'
            }
          };
        }

      default:
        console.warn(`Unknown module type: ${moduleType}`);
        return {
          output: inputData,
          metadata: {
            processingTime: Date.now(),
            method: 'unknown-passthrough',
            passThrough: true,
            moduleType
          }
        };
    }
  };
};
