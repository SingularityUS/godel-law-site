
/**
 * Node Processor Utility
 * 
 * Purpose: Handles processing of individual nodes with ChatGPT, enhanced for complete document processing
 */

import { AllNodes, HelperNode } from "@/types/workbench";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { useChatGPTApi } from "../useChatGPTApi";
import { processWithBatching, shouldUseBatchProcessing } from "./batchProcessor";
import { DocumentChunk } from "./documentChunker";
import { parseJsonResponse, parseGrammarResponse } from "./parsing";

export const createNodeProcessor = (
  nodes: AllNodes[], 
  callChatGPT: ReturnType<typeof useChatGPTApi>['callChatGPT']
) => {
  return async (
    nodeId: string, 
    inputData: any, 
    onProgress?: (completed: number, total: number) => void
  ): Promise<any> => {
    const startTime = Date.now();
    const node = nodes.find(n => n.id === nodeId) as HelperNode;
    
    if (!node || node.data?.moduleType === 'document-input') {
      return inputData; // Skip document input nodes
    }

    const moduleType = node.data.moduleType as ModuleKind;
    const moduleDef = MODULE_DEFINITIONS.find(m => m.type === moduleType);
    
    // Handle pass-through modules (like deprecated text extractor)
    if (moduleDef?.isPassThrough) {
      console.log(`Passing through ${moduleType} (deprecated module)`);
      return {
        moduleType,
        output: inputData, // Pass through unchanged
        metadata: {
          passThrough: true,
          deprecated: true,
          timestamp: new Date().toISOString(),
          processingTime: 0
        }
      };
    }
    
    if (!moduleDef?.supportsChatGPT) {
      console.warn(`Module ${moduleType} does not support ChatGPT processing`);
      return inputData; // Pass through unchanged
    }

    // Use custom prompt if available, otherwise use default legal prompt
    const systemPrompt = node.data.promptOverride || moduleDef.defaultPrompt;
    
    console.log(`Processing legal module ${nodeId} (${moduleType}) with ChatGPT`);
    
    // Special handling for paragraph splitter and grammar checker to ensure ALL content is processed
    if (moduleType === 'paragraph-splitter' || moduleType === 'grammar-checker') {
      return await processAllContent(
        moduleType, 
        inputData, 
        systemPrompt, 
        callChatGPT, 
        onProgress, 
        startTime
      );
    }
    
    // Check if we need batch processing for other modules
    if (shouldUseBatchProcessing(inputData)) {
      console.log(`Using batch processing for module ${moduleType}`);
      
      // Define processing function for individual chunks
      const processChunk = async (chunkContent: string, chunkInfo?: DocumentChunk) => {
        let promptData: string;
        if (typeof chunkContent === 'object') {
          promptData = JSON.stringify(chunkContent, null, 2);
        } else {
          promptData = String(chunkContent);
        }
        
        // Add chunk context to prompt if available
        if (chunkInfo) {
          promptData = `[Chunk ${chunkInfo.chunkIndex + 1} of ${chunkInfo.totalChunks}]\n\n${promptData}`;
          console.log(`Processing chunk ${chunkInfo.chunkIndex + 1}/${chunkInfo.totalChunks} for ${moduleType}`);
        }
        
        const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Use appropriate parser based on module type
        let processedOutput: any;
        if (moduleType === 'grammar-checker') {
          processedOutput = parseGrammarResponse(result.response);
        } else {
          processedOutput = parseJsonResponse(result.response, moduleType);
        }
        
        return {
          moduleType,
          output: processedOutput,
          metadata: {
            model: result.model,
            timestamp: new Date().toISOString(),
            chunkProcessed: true,
            chunkInfo: chunkInfo ? {
              index: chunkInfo.chunkIndex,
              total: chunkInfo.totalChunks
            } : undefined
          }
        };
      };
      
      // Process with batching
      const result = await processWithBatching(inputData, processChunk, onProgress);
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTime,
          batchProcessed: true,
          totalProcessingTime: processingTime
        }
      };
      
    } else {
      // Single document processing
      let promptData: string;
      if (typeof inputData === 'object') {
        promptData = JSON.stringify(inputData, null, 2);
      } else {
        promptData = String(inputData);
      }
      
      console.log(`Processing single document for ${moduleType}`);
      
      const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Use appropriate parser based on module type
      let processedOutput: any;
      if (moduleType === 'grammar-checker') {
        processedOutput = parseGrammarResponse(result.response);
      } else {
        processedOutput = parseJsonResponse(result.response, moduleType);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        moduleType,
        output: processedOutput,
        metadata: {
          processingTime,
          model: result.model,
          timestamp: new Date().toISOString()
        }
      };
    }
  };
};

/**
 * Enhanced processing for paragraph splitter and grammar checker to handle ALL content
 */
async function processAllContent(
  moduleType: ModuleKind,
  inputData: any,
  systemPrompt: string,
  callChatGPT: any,
  onProgress?: (completed: number, total: number) => void,
  startTime: number = Date.now()
): Promise<any> {
  
  if (moduleType === 'paragraph-splitter') {
    // Process all content through paragraph splitter
    let promptData: string;
    if (typeof inputData === 'object') {
      // Handle chunked content by combining all chunks
      if (inputData.chunks && Array.isArray(inputData.chunks)) {
        promptData = inputData.chunks.map((chunk: any) => chunk.content || chunk.text || chunk).join('\n\n');
        console.log(`Combining ${inputData.chunks.length} chunks for paragraph splitting`);
      } else {
        promptData = JSON.stringify(inputData, null, 2);
      }
    } else {
      promptData = String(inputData);
    }
    
    console.log(`Processing ALL content for paragraph splitting (${promptData.length} characters)`);
    
    const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
    
    if (result.error) {
      throw new Error(result.error);
    }

    const processedOutput = parseJsonResponse(result.response, moduleType);
    const processingTime = Date.now() - startTime;
    
    console.log(`Paragraph splitter completed: ${processedOutput?.output?.totalParagraphs || 'unknown'} paragraphs found`);
    
    return {
      moduleType,
      output: processedOutput,
      metadata: {
        processingTime,
        model: result.model,
        timestamp: new Date().toISOString(),
        totalParagraphs: processedOutput?.output?.totalParagraphs || 0,
        contentLength: promptData.length
      }
    };
  }
  
  if (moduleType === 'grammar-checker') {
    // Process ALL paragraphs from paragraph splitter output
    let paragraphs: any[] = [];
    
    if (inputData?.output?.paragraphs && Array.isArray(inputData.output.paragraphs)) {
      paragraphs = inputData.output.paragraphs;
    } else if (Array.isArray(inputData)) {
      paragraphs = inputData;
    } else if (inputData?.paragraphs && Array.isArray(inputData.paragraphs)) {
      paragraphs = inputData.paragraphs;
    } else {
      console.warn('Grammar checker: No paragraphs array found in input data');
      return inputData;
    }
    
    console.log(`Grammar checker processing ALL ${paragraphs.length} paragraphs`);
    
    // Process paragraphs in batches to avoid token limits
    const batchSize = 10; // Process 10 paragraphs at a time
    const totalBatches = Math.ceil(paragraphs.length / batchSize);
    const allAnalysis: any[] = [];
    
    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, paragraphs.length);
      const batchParagraphs = paragraphs.slice(batchStart, batchEnd);
      
      console.log(`Processing paragraph batch ${i + 1}/${totalBatches} (paragraphs ${batchStart + 1}-${batchEnd})`);
      
      if (onProgress) {
        onProgress(batchEnd, paragraphs.length);
      }
      
      const batchData = {
        paragraphs: batchParagraphs,
        batchInfo: {
          batchNumber: i + 1,
          totalBatches,
          paragraphRange: `${batchStart + 1}-${batchEnd}`,
          totalParagraphs: paragraphs.length
        }
      };
      
      const promptData = JSON.stringify(batchData, null, 2);
      const result = await callChatGPT(promptData, systemPrompt, 'gpt-4o-mini');
      
      if (result.error) {
        throw new Error(`Batch ${i + 1} failed: ${result.error}`);
      }
      
      const batchOutput = parseGrammarResponse(result.response);
      if (batchOutput?.analysis && Array.isArray(batchOutput.analysis)) {
        allAnalysis.push(...batchOutput.analysis);
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Grammar checker completed: ${allAnalysis.length} paragraphs analyzed`);
    
    return {
      moduleType,
      output: {
        analysis: allAnalysis,
        overallAssessment: {
          totalParagraphs: paragraphs.length,
          paragraphsAnalyzed: allAnalysis.length,
          totalErrors: allAnalysis.reduce((sum, p) => sum + (p.suggestions?.length || 0), 0),
          averageScore: allAnalysis.reduce((sum, p) => sum + (p.legalWritingScore || 0), 0) / allAnalysis.length,
          writingQuality: calculateOverallQuality(allAnalysis),
          recommendations: generateRecommendations(allAnalysis)
        }
      },
      metadata: {
        processingTime,
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
        totalParagraphs: paragraphs.length,
        paragraphsAnalyzed: allAnalysis.length,
        batchesProcessed: totalBatches
      }
    };
  }
  
  return inputData;
}

function calculateOverallQuality(analysis: any[]): string {
  const avgScore = analysis.reduce((sum, p) => sum + (p.legalWritingScore || 0), 0) / analysis.length;
  if (avgScore >= 8) return 'excellent';
  if (avgScore >= 6) return 'good';
  if (avgScore >= 4) return 'needs_improvement';
  return 'poor';
}

function generateRecommendations(analysis: any[]): string[] {
  const commonIssues = new Map<string, number>();
  
  analysis.forEach(p => {
    p.suggestions?.forEach((s: any) => {
      const key = s.issue || s.type || 'general';
      commonIssues.set(key, (commonIssues.get(key) || 0) + 1);
    });
  });
  
  return Array.from(commonIssues.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => `Address ${issue} issues (found ${count} instances)`);
}
